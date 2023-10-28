import { Button, DatePicker, DatePickerProps, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import { useMyContext } from "../../hooks/useContext";
import dayjs from "dayjs";
import styles from "./index.module.scss";
import { useGetGroupDetails, useGetIdAndGroupId } from "../../hooks/useRequest";
import { Guest } from "../../types";

const Action = ({ onAdd }: any) => {
  const { date, setDate } = useMyContext();

  const [id, groupOrderId] = useGetIdAndGroupId();
  const groupDetail = useGetGroupDetails(groupOrderId)
  const guest  = groupDetail?.guests;

  const groupTip = `Create group order on foodpanda first, and then click this button`;
  const spitTip = `After order finished, click this button to split order to each person`;

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
            Create group order
          </Button>
        </Tooltip>
        <Tooltip title={spitTip}>
          <Button
            disabled={!groupOrderId}
            type="primary"
            className={styles.btn}
            // onClick={onAdd}
          >
            Split dish
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default Action;
