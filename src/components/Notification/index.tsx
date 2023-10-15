import React, { useEffect } from "react";
import styles from "./index.module.scss";
import { Switch } from "antd";
import { useMyContext } from "../../hooks/useContext";

const Notification = () => {
  const { storage, updateStorage, tab } = useMyContext();
  const { enableNote } = storage;
  const onChange = (checked: boolean) => {
    updateStorage("enableNote", checked);
  }

  useEffect(() => {
    if(!tab?.id) { return; }
    // chrome.tabs.sendMessage(tab.id, { type: 'TIMER', enable: !!enableNote, count: 5000 })
  }, [enableNote, tab])

  return (
    <div className={styles.notification}>
      Notification <Switch checked={enableNote} onChange={onChange} />
    </div>
  );
};

export default Notification;
