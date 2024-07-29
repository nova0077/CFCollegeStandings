document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refreshButton').addEventListener('click', () => {
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Please wait for few seconds';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        // Send a message to the content script in the active tab
        chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshList' }, (response) => {
          if (chrome.runtime.lastError) {
            statusElement.textContent = 'Error: Could not reach the content script.';
          } else {
            if (response && response.status === 'success') {
              statusElement.textContent = 'List updated successfully!';
            } else {
              statusElement.textContent = 'Failed to update the list.';
            }
          }
          setTimeout(() => {
            window.close();
          }, 2000);
        });
      }
    });
  });
});
