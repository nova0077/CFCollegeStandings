function addCustomTab(listId) {
  const tabContainer = document.getElementsByClassName('second-level-menu-list')[0];

  if (tabContainer) {
    const customTab = document.createElement('li');
    customTab.innerHTML = `<a href="https://codeforces.com/contest/1995/standings?list=${listId}" id="custom-standings-tab">College Standings</a>`;

    const friendsStandingsTab = tabContainer.querySelector('a[href*="standings/friends"]');
    friendsStandingsTab.parentNode.insertAdjacentElement('afterend', customTab);
  }
}

// Add custom tab if list ID is in local storage
const listId = localStorage.getItem('listId');
if (listId) {
  addCustomTab(listId);
} else {
  console.error('List ID not found in local storage');
}