import { Button, DatePicker, DatePickerProps, Tooltip } from "antd";
import React from "react";
import { useMyContext } from "../../hooks/useContext";
import dayjs from "dayjs";
import styles from "./index.module.scss";
import { useGetIdAndGroupId } from "../../hooks/useRequest";

const Action = ({ onAdd }: any) => {
  const { date, setDate } = useMyContext();

  const [id, groupOrderId] = useGetIdAndGroupId();

  const groupTip = `Create group order on foodpanda first, and then click this button`;

  const onOk = (value: DatePickerProps["value"]) => {
    setDate(dayjs(value));
  };
  
  return (
    <div className={styles.date}>
      <DatePicker
        value={date}
        showTime
        onOk={onOk}
        allowClear={false}
        format={"YYYY-MM-DD HH:mm"}
      />
      <div className={styles.btns}>
        <Tooltip title={groupTip}>
          <Button
            disabled={!groupOrderId}
            type="primary"
            className={styles.btn}
            onClick={onAdd}
          >
            Add Guests
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default Action;
