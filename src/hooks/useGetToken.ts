import { useEffect } from "react";
import { useMyContext } from "./useContext";
import { getFromStorage } from "../utils";
import { getAddress } from "./useRequest";

export const useGetInitial = () => {
  const { updateStorage, setVendorCode, setTab } = useMyContext()

  useEffect(() => {
    (async () => {
      const token = await getFromStorage("token");
      const host = await getFromStorage("host");
      const list = await getFromStorage("list");
      const enableNote = await getFromStorage("enableNote");
      updateStorage('list', list ?? {});
      updateStorage('enableNote', !!enableNote);
      chrome.tabs.query({ "status": "complete" }, function (tabs) {
        const tab = tabs.find(item => item.url?.startsWith('https://www.foodpanda.sg'));
        const url = tab?.url;
        const id = tab?.id;
        setTab(tab);
        if(token && host?.code) {
          updateStorage('token', token);
          updateStorage('host', host);
          return;
        }
        if (url) {
          chrome.cookies.getAll({ url }, (cookie) => {
            const tokenValue = cookie.find(item => item.name === 'token')?.value;
            updateStorage('token', tokenValue || '');
          });
        }
        if (id && !host?.code) {
          chrome.tabs.sendMessage(id, { type: 'RECEIVE' })
          chrome.runtime.onMessage.addListener((message) => {
            const user = message.essential.user
            updateStorage('host', {
              name: `${user.firstName} ${user.lastName}`,
              code: user.code
            })
          })
        }
      });
      if(token) {
        const referenceId = await getAddress(token);
        updateStorage("referenceId", referenceId);
      }
    })()
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // since only one tab should be active and in the current window at once
      // the return variable should only have one entry
      var activeTab = tabs[0];
      const restId = /^https:\/\/www.foodpanda.sg\/restaurant\/(\w+)/.exec(activeTab.url || '')?.[1]
      if(restId){
        setVendorCode(restId)
      }
    });
  }, [])
}