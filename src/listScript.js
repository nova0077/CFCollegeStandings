// Function to get CSRF token
function getCsrfToken() {
  const csrfTokenElement = document.querySelector('meta[name="X-Csrf-Token"]');
  return csrfTokenElement ? csrfTokenElement.getAttribute('content') : null;
}


// Function to get user handle from profile page
async function getUserHandle() {
  const x = document.getElementsByClassName('lang-chooser');
  if (x && x.length > 0) {
    const langChooserElement = x[0];
    const profileLink = langChooserElement.querySelector('a[href*="/profile/"]');
    if (profileLink) {
      const profileName = profileLink.textContent.trim();
      return profileName;
    }
  }
  return "";
}


// Function to get user organization from profile page
async function getUserOrganization(handle) {
  const response = await fetch(`https://codeforces.com/profile/${handle}`);
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const organizationLink = doc.querySelector('div.main-info div a[href^="/ratings/organization/"]');
  return organizationLink ? organizationLink.getAttribute('href').split('/').pop() : null;
}


// Function to get or create the list ID
async function getOrCreateList(csrfToken, listName) {
  const response = await fetch('https://codeforces.com/lists');
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const existingLists = doc.querySelectorAll('.datatable a[href^="/list/"]');
  let listId = null;

  existingLists.forEach(list => {
    if (list.textContent.trim() === listName) {
      listId = list.getAttribute('href').split('/').pop();
    }
  });

  if (!listId) {
    const url = 'https://codeforces.com/lists/new';
    const data = new URLSearchParams();
    data.append('csrf_token', csrfToken);
    data.append('action', 'saveList');
    data.append('englishName', listName);
    data.append('russianName', '');

    const createResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: data.toString()
    });

    if (createResponse.ok) {
      return await getOrCreateList(csrfToken, listName);
    }
  }
  return listId;
}


// Function to get handles from organization page with pagination
async function getHandlesFromOrganization(organizationId) {
  let userList = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await fetch(`https://codeforces.com/ratings/organization/${organizationId}/page/${page}`);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const datatable = doc.querySelector('.datatable.ratingsDatatable');
    const ratedUsers = datatable ? datatable.querySelectorAll('a.rated-user') : [];

    if (ratedUsers.length === 0) {
      hasMorePages = false;
    } else {
      const lastFetchedUser = ratedUsers[ratedUsers.length - 1].textContent.trim();

      if (userList.length > 0 && userList[userList.length - 1] === lastFetchedUser) {
        hasMorePages = false;
      } else {
        for (const user of ratedUsers) {
          userList.push(user.textContent.trim());
          if (userList.length >= 1000) {
            hasMorePages = false;
            break;
          }
        }
        page++;
      }
    }
    if (ratedUsers.length < 200) {
      hasMorePages = false;
    }
  }
  
  return userList;
}


// Function to add members to the list
async function addMembersToList(csrfToken, listId, handlesToAdd) {
  const url = `https://codeforces.com/list/${listId}`;
  const data = new FormData();
  data.append('csrf_token', csrfToken);
  data.append('action', 'addMembers');
  data.append('handlesToAdd', handlesToAdd.join(' '));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'referer': `https://codeforces.com/list/${listId}`
    },
    body: data
  });
  return response.ok;
}


// Re-fetch organization list function
async function refetchOrganizationList(sendResponse = () => { }) {
  const csrfToken = getCsrfToken();

  if (csrfToken) {
    const handle = await getUserHandle();
    const organizationId = await getUserOrganization(handle);

    if (organizationId) {
      const listName = `organization-${organizationId}`;
      const listId = await getOrCreateList(csrfToken, listName);

      if (listId) {
        const handles = await getHandlesFromOrganization(organizationId);
        const addMembersResponse = await addMembersToList(csrfToken, listId, handles);

        if (addMembersResponse) {
          localStorage.setItem('listId', listId);
          sendResponse({ status: 'success' });
        } else {
          sendResponse({ status: 'error' });
        }
      } else {
        sendResponse({ status: 'error' });
      }
    } else {
      sendResponse({ status: 'error' });
    }
  } else {
    sendResponse({ status: 'error' });
  }
}

// Listener for refreshList action
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'refreshList') {
    refetchOrganizationList(sendResponse);
    return true; // Required to use sendResponse asynchronously
  }
});

// Initial execution
(async function () {
  const lastFetched = localStorage.getItem('lastFetched');
  const oneDay = 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (!lastFetched || now - lastFetched > oneDay) {
    refetchOrganizationList((response) => {
      if (response.status === 'success') {
        localStorage.setItem('lastFetched', Date.now());
      }
    });
  }
})();