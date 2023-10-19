export const getFromStorage = async (key: string) => {
  const data = await chrome?.storage?.local?.get(key)
  return data[key]
}

export const setToStorage = async (key: string, value: any) => {
  await chrome?.storage?.local?.set({ [key]: value })
}

export const debounce = (callback: (...args: any) => void, wait: number) => {
  // initialize the timer
  let timer: NodeJS.Timeout;

  const debouncedFunc = (...args: any) => {
    if (timer) clearTimeout(timer)
    // 使用箭头函数来处理this问题
    timer = setTimeout(() => callback.apply(this, args), wait)
  }

  return debouncedFunc;
}

export function sendMessagePromise(tabId: number, item: Record<string, string>): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, item, (response: Record<string, string>) => {
          if(response) {
              resolve(response);
          } else {
              reject({});
          }
      });
  });
}