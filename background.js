chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['listScript.js']
  }, () => {
    chrome.windows.create({
      url: "popup.html",
      type: "popup",
      width: 400,
      height: 300
    });
  });
});