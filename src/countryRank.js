// Function to get the CSRF token
function getCsrfToken() {
  const csrfTokenElement = document.querySelector('meta[name="X-Csrf-Token"]');
  return csrfTokenElement ? csrfTokenElement.getAttribute('content') : null;
}


// Function to get the user handle
function getUserHandle() {
  const langChooser = document.querySelector('.lang-chooser a[href*="/profile/"]');
  return langChooser ? langChooser.textContent.trim() : "";
}

// Function to get the user's country from their profile using the API
async function getUserCountry(handle) {
  try {
    const response = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
    const data = await response.json();

    if (data.status === 'OK' && data.result.length > 0) {
      return data.result[0].country || 'Unknown';
    }
    return 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}


// Function to get the country title from the user's country page
async function getUserCountryTitle(handle) {
  const profileResponse = await fetch(`https://codeforces.com/profile/${handle}`);
  const profileText = await profileResponse.text();
  const profileParser = new DOMParser();
  const profileDoc = profileParser.parseFromString(profileText, 'text/html');
  const countryLink = profileDoc.querySelector('div.main-info div a[href^="/ratings/country/"]:not([href*="/city/"])');

  if (!countryLink) {
    throw new Error('Country link not found on the profile page.');
  }

  const countryUrl = `https://codeforces.com${countryLink.getAttribute('href')}`;
  const ratingsResponse = await fetch(countryUrl);
  const ratingsText = await ratingsResponse.text();
  const ratingsParser = new DOMParser();
  const ratingsDoc = ratingsParser.parseFromString(ratingsText, 'text/html');
  const firstFlagElement = ratingsDoc.querySelector('img.standings-flag');

  if (!firstFlagElement) {
    throw new Error('Flag not found on the ratings page.');
  }

  return firstFlagElement.title;
}


// Function to fetch standings and count users with matching country
async function fetchStandings(contestId, handle, userWorldRank) {
  let count = 0;
  let page = 1;
  const usersPerPage = 200;
  const userCountry = await getUserCountryTitle(handle);
  const maxPage = Math.ceil(userWorldRank / usersPerPage);
  let hasMore = true;

  while (hasMore && page <= maxPage) {
    const response = await fetch(`https://codeforces.com/contest/${contestId}/standings/page/${page}`);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const rows = doc.querySelectorAll('.standings > tbody > tr');

    if (rows.length === 0) {
      hasMore = false;
    } else {
      rows.forEach(row => {
        const handleElement = row.querySelector('.contestant-cell a');
        const countryElement = row.querySelector('.standings-flag');

        if (handleElement && countryElement) {
          const handle = handleElement.textContent.trim();
          const country = countryElement.title.trim();

          if (country === userCountry) {
            const rank = row.querySelector("td").textContent.trim();
            if (rank <= userWorldRank) {
              count++;
            }
          }
        }
      });
      page++;
    }
  }
  return count;
}


// Function to get the rank of the current user
async function getUserRank(contestId, handle) {
  const response = await fetch(`https://codeforces.com/api/contest.standings?contestId=${contestId}&handles=${handle}`);
  const data = await response.json();
  const user = data.result.rows.find(row => row.party.members.some(member => member.handle === handle));
  return user ? user.rank : null;
}


// Function to update the DOM with the country rank
function updateCountryRankDOM(userCountry, count) {
  let statusElement = document.querySelector('.contest-status');

  if(!statusElement){
    const contestNameParent = document.querySelector('.contest-name')?.parentElement;
    if(contestNameParent){
      const newSpan = document.createElement('span');
      newSpan.className = 'contest-status';
      newSpan.textContent = "Final standings";

      const oldTextNode = contestNameParent.childNodes[2];
      contestNameParent.replaceChild(newSpan, oldTextNode);
    }
  }

  statusElement = document.querySelector('.contest-status');

  if (statusElement && statusElement.textContent.includes('Final standings')) {
    let rankElement = document.querySelector('.country-rank');

    if (!rankElement) {
      rankElement = document.createElement('span');
      rankElement.className = 'country-rank noLava';
      statusElement.appendChild(rankElement);
    }

    if (count === 0) {
      rankElement.innerHTML = `| <span class="country-name">${userCountry} Rank </span> 
                                 <span> : </span>
                                 <span class="rank-number">Not available</span>`;
    } else {
      rankElement.innerHTML = `| <span class="country-name">${userCountry} Rank </span>
                                 <span> : </span>
                                 <span class="rank-number">${count}</span>`;
    }
    let styleElement = document.getElementById('custom-styles');

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-styles';
      styleElement.textContent = `
         .country-rank {
           font-weight: bold;
           margin-left: 5px;
         }
         .country-name {
           color: red;
         }
         .rank-number {
           color: green;
         }
       `;
      document.head.appendChild(styleElement);
    }
  }
}


// Function to fetch and display country rank
async function fetchAndDisplayCountryRank() {
  const contestId = window.location.pathname.match(/\/contest\/(\d+)/)[1];
  const handle = getUserHandle();
  const userCountry = await getUserCountry(handle);
  const userWorldRank = await getUserRank(contestId, handle);
  const ratingChangesLink = document.querySelector('.second-level-menu a[href$="/ratings"]');

  if (userWorldRank && ratingChangesLink) {
    const key = `${userCountry.toLowerCase().replace(/ /g, '-')}-rank`;
    const storedRanks = JSON.parse(localStorage.getItem('cf_country_ranks') || '{}');
    const existingRank = storedRanks[contestId] && storedRanks[contestId][key];

    if (!existingRank || existingRank === 0) {
      const count = await fetchStandings(contestId, handle, userWorldRank);

      storedRanks[contestId] = storedRanks[contestId] || {};
      storedRanks[contestId][key] = count;
      localStorage.setItem('cf_country_ranks', JSON.stringify(storedRanks));
      updateCountryRankDOM(userCountry, count);
    } else {
      updateCountryRankDOM(userCountry, existingRank);
    }
  } else {
    updateCountryRankDOM(userCountry, 0);
  }
}


// Call the function to execute
fetchAndDisplayCountryRank();
