// Function to get CSRF token
function getCsrfToken() {
  const csrfTokenElement = document.querySelector('meta[name="X-Csrf-Token"]');
  return csrfTokenElement ? csrfTokenElement.getAttribute('content') : null;
}

// Function to get user handle from profile page
function getUserHandle() {
  const x = document.getElementsByClassName('lang-chooser');
  if (x && x.length > 0) {
    const langChooserElement = x[0];
    const profileLink = langChooserElement.querySelector('a[href*="/profile/"]');
    if (profileLink) {
      const profileName = profileLink.textContent.trim();
      return profileName;
    } else {
      console.log('User handle not found');
    }
  } else {
    console.log('Element with class "lang-chooser" not found');
  }
  return "xyz";
}

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
    console.log(createResponse);
    if (createResponse.ok) {
      return await getOrCreateList(csrfToken, listName);
    }
  }
  return listId;
}

// Function to get handles from organization page
async function getHandlesFromOrganization(organizationId) {
  const response = await fetch(`https://codeforces.com/ratings/organization/${organizationId}`);
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const datatable = doc.querySelector('.datatable.ratingsDatatable');
  const ratedUsers = datatable.querySelectorAll('a.rated-user');
  const userList = [];
  
  ratedUsers.forEach(user => {
    userList.push(user.textContent.trim());
  });
  
  return userList;
}

async function addMembersToList(csrfToken, listId, handlesToAdd) {
  const url = `https://codeforces.com/list/${listId}`;
  const data = new FormData();
  data.append('csrf_token', csrfToken);
  data.append('action', 'addMembers');
  data.append('handlesToAdd', handlesToAdd.join(' ')); // Ensure handles are space-separated

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'referer': `https://codeforces.com/list/${listId}`
    },
    body: data
  });

  return response.ok;
}

// Function to add the custom tab
function addCustomTab(listId) {
  const tabContainer = document.getElementsByClassName('second-level-menu-list')[0];

  if (tabContainer) {
    const customTab = document.createElement('li');
    const standingsurl = `https://codeforces.com/contest/1995/standings?list=${listId}`;
    customTab.innerHTML = `<a href=${standingsurl} id="custom-standings-tab">College Standings</a>`;

    const friendsStandingsTab = tabContainer.querySelector('a[href*="standings/friends"]');
    friendsStandingsTab.parentNode.insertAdjacentElement('afterend', customTab);
  }
}

(async function() {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    const handle = getUserHandle();
    const organizationId = await getUserOrganization(handle);
    
    if (organizationId) {
      const listName = `organization-${organizationId}`;
      const listId = await getOrCreateList(csrfToken, listName);
      if (listId) {
        const handles = await getHandlesFromOrganization(organizationId);
        console.log(handles);
        const addMembersResponse = await addMembersToList(csrfToken, listId, handles);
        if(addMembersResponse){
          console.log("Members added successfully");
          addCustomTab(listId);
        }
        else{
          console.log("there is an error adding members, please re-try");
        }
      } else {
        console.error('Failed to create or get the list');
      }
    } else {
      console.error('Organization ID not found');
    }
  } else {
    console.error('CSRF token not found');
  }
})();