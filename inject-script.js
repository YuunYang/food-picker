function parseEssentialDetails() {
  return {
    user: window.__PROVIDER_PROPS__.user,
    api_key: window.__PROVIDER_PROPS__.config.FIREBASE_API_KEY,
  };
}

console.log("inject-script message registered");

window.addEventListener(
  "message",
  function (event) {
    console.log("food-picker message registered");
    if (event.data.type && event.data.type === "RECEIVE") {
      let essential = parseEssentialDetails();
      window.postMessage({ type: "FROM_PAGE", essential });
    }
    if (event.data.type && event.data.type === "TIMER") {
      let foodPickerTimer = this.sessionStorage.getItem("foodPickerTimer");
      if (event.data.enable === false) {
        this.sessionStorage.removeItem("foodPickerTimer");
        return;
      }
      if (foodPickerTimer) {
        this.clearTimeout(foodPickerTimer);
      }
      const count = event.data.count;
      foodPickerTimer = this.setTimeout(() => {
        console.log("notification registered");
        Notification.requestPermission().then((result) => {
          console.log(result);
          const img = "favicon.ico";
          const text = "Hey there! Your food is ready!";
          new Notification("To do list", { body: text, icon: img });
        });
      }, count);
      this.sessionStorage.setItem("foodPickerTimer", foodPickerTimer);
    }
  },
  false
);
