document.getElementById('refresh-list').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'refreshList' }, response => {
    if (response.status === 'success') {
      document.getElementById('status').textContent = 'Organization list updated!';
    } else {
      document.getElementById('status').textContent = 'Failed to update the list. Please try again.';
    }
    setTimeout(() => {
      window.close();
    }, 2000);
  });
});
