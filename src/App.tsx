import React, { createContext, useState } from "react";
import styles from './App.module.scss';
import logo from './svgs/logo.svg';
import { MyContextType } from "./types";
import { useMyContext } from "./hooks/useContext";
import Auth from "./containers/Auth";
import { useGetInitial } from "./hooks/useGetToken";
import dayjs from "dayjs";
import { setToStorage } from "./utils";
import { useChromeStorage } from "./hooks/useChromeStorage";
import Home from "./containers/Home";
import Notification from "./components/Notification";
import release from './release.json';

// Create the context
export const MyContext = createContext<MyContextType | null>(null);

// Create a provider component
export const MyContextProvider = ({ children }: any) => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const day = new Date().getDate();
  const hour = new Date().getHours();
  const formatHour = hour < 10 ? 10 : hour <= 15 ? hour : 19;
  const [date, setDate] = useState(dayjs(new Date(year, month, day, formatHour)));
  const [storage, setStorage] = useState<any>({});
  const [vendorCode, setVendorCode] = useState('');
  const [tab, setTab] = useState<chrome.tabs.Tab>();

  const updateStorage = (key: string, value: any) => {
    setStorage((prev: any) => ({ ...prev, [key]: value }))
    setToStorage(key, value);
  }
  
  return (
    <MyContext.Provider value={{ date, setDate, storage, updateStorage, vendorCode, setVendorCode, tab, setTab }}>
      {children}
    </MyContext.Provider>
  );
};


const App = () => {
  const { storage } = useMyContext();
  const { token, host } = storage;
  useChromeStorage();
  useGetInitial()
  return (
    <div className={styles.app}>
      <div className={styles.title}>
        <img src={logo} alt="food-picker" />
        Food Picker - Fuan Tuan
        <span className={styles.notificationWrap}>
          <Notification />
        </span>
      </div>
      {token && host?.customer_code ? <Home /> : <Auth />}
      <footer className={styles.footer}>
        Powered by Fuantuan. {release.release_date && `Last update ${dayjs(release.release_date).format('YYYY-MM-DD')}`}
      </footer>
    </div>
  );
}

const WrapApp = () => {
  return (
    <MyContextProvider>
      <App />
    </MyContextProvider>
  )
}

export default WrapApp;
