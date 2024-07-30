function addCustomTab(listId) {
  const tabContainer = document.getElementsByClassName('second-level-menu-list')[0];

  if (tabContainer) {
    const customTab = document.createElement('li');
    const currentUrl = window.location.href;
    const contestIdMatch = currentUrl.match(/\/contest\/(\d+)/);

    if (contestIdMatch) {
      const contestId = contestIdMatch[1];
      const standingsUrl = `https://codeforces.com/contest/${contestId}/standings?list=${listId}`;
      customTab.innerHTML = `<a href="${standingsUrl}" id="custom-standings-tab">College Standings</a>`;

      const friendsStandingsTab = tabContainer.querySelector('a[href*="standings/friends"]');
      friendsStandingsTab.parentNode.insertAdjacentElement('afterend', customTab);

      const tabs = tabContainer.querySelectorAll('li');
      customTab.addEventListener('click', (event) => {
        tabs.forEach(tab => {
          tab.classList.remove('current', 'selectedLava');
        });
        customTab.classList.add('current', 'selectedLava');
      });

      if (currentUrl.includes(`standings?list=${listId}`)) {
        tabs.forEach(tab => {
          tab.classList.remove('current', 'selectedLava');
        });
        customTab.classList.add('current', 'selectedLava');
      }
    }
  }
}

// Add custom tab if list ID is in local storage
const listId = localStorage.getItem('listId');
if (listId) {
  addCustomTab(listId);
}
