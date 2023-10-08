function injectScript(file, node) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement("script");
  s.setAttribute("type", "text/javascript");
  s.setAttribute("src", file);
  th.appendChild(s);
}
injectScript(chrome.runtime.getURL("inject-script.js"), "body");

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "GROUP_ID") {
    localStorage.setItem('groupOrderOtp', JSON.stringify({
      groupOrderId: request.groupOrderId,
      isHost: true,
    }));
    localStorage.setItem('groupOrderInviteLink', 'https://foodpanda.page.link');
    localStorage.setItem('groupOrderId', request.groupOrderId);
    localStorage.setItem('groupOrderUrl', request.groupOrderUrl);
  }
  if (!request.type === "RECEIVE") {
    return;
  }
  window.postMessage(request);
});

window.addEventListener(
  "message",
  async (event) => {
    if (event.data.type && event.data.type === "FROM_PAGE") {
      chrome.runtime.sendMessage({
        essential: event.data.essential,
      });
    }
  },
  false
);
