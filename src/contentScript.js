function addCustomTab(listId) {
  const tabContainer = document.getElementsByClassName('second-level-menu-list')[0];

  if (tabContainer) {
    const customTab = document.createElement('li');
    customTab.innerHTML = `<a href="https://codeforces.com/contest/1995/standings?list=${listId}" id="custom-standings-tab">College Standings</a>`;

    const friendsStandingsTab = tabContainer.querySelector('a[href*="standings/friends"]');
    friendsStandingsTab.parentNode.insertAdjacentElement('afterend', customTab);

    const tabs = tabContainer.querySelectorAll('li');
    customTab.addEventListener('click', (event) => {
      // Remove the selectedLava class from all tabs
      tabs.forEach(tab => {
        tab.classList.remove('current', 'selectedLava');
      });
      // Set the clicked tab as selected
      customTab.classList.add('current', 'selectedLava');
    });

    // Check the current URL to see if we should pre-select this tab
    const currentUrl = window.location.href;
    if (currentUrl.includes(`standings?list=${listId}`)) {
      tabs.forEach(tab => {
        tab.classList.remove('current', 'selectedLava');
      });
      customTab.classList.add('current', 'selectedLava');
    }
  }
}

// Add custom tab if list ID is in local storage
const listId = localStorage.getItem('listId');
if (listId) {
  addCustomTab(listId);
}