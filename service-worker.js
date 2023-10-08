/* eslint-disable no-undef */
const keys = {
  lunch: "lunch",
  ot: "ot",
}

const oneDay = 86400000;

const setUpAlarm = async (key) => {
  const enableNote = (await chrome?.storage?.local?.get("enableNote"))
    .enableNote;
  if (enableNote) {

    const thisLunch = new Date().setHours(10, 30, 0, 0);
    const thisOT = new Date().setHours(16, 30, 0, 0);

    const noteTime = key === keys.lunch ? thisLunch : thisOT;

    let delay = noteTime - Date.now();

    if(delay < 0) {
      delay = oneDay + delay;
    }

    await chrome.alarms.create(key, {
      delayInMinutes: delay / (60 * 1000),
      periodInMinutes: 24 * 60,
    });
  } else {
    chrome.notifications.create(`close notification`, {
      title: "Food picker",
      message: "Notification is closed",
      type: "basic",
      iconUrl: "favicon.ico",
    });
    await chrome.alarms.clear(key);
  }
};
setUpAlarm(keys.lunch);
setUpAlarm(keys.ot);

const handlerAlarm = (alarm) => {
  const name = alarm.name;
  const noteName = `${+new Date()}`;
  let message = "";
  if (name === keys.lunch) {
    message = "Don't forget to order lunch.";
  } else if (name === keys.ot) {
    message = "Don't forget to order dinner if you work OT.";
  }
  message += `\n\nClick to open foodpanda.`;
  chrome.notifications.create(noteName, {
    title: "Food picker",
    message,
    type: "basic",
    iconUrl: "favicon.ico",
  });
  chrome.notifications.onClicked.addListener(() => {
    chrome.tabs.create({ url: "https://www.foodpanda.sg/" });
    chrome.notifications.clear(noteName)
  });
}

chrome.storage.onChanged.addListener((changes) => {
  for (let [key] of Object.entries(changes)) {
    console.log(key)
    if(key === 'enableNote') {
      setUpAlarm(keys.lunch);
      setUpAlarm(keys.ot);
    }
  }
});

chrome.alarms.onAlarm.addListener(handlerAlarm);