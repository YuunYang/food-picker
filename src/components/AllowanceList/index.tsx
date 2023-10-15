import React, { useEffect, useMemo, useState } from "react";
import {
  useGetAllowanceList,
  useGetParticipants,
  useInitialGroup,
  useSearchColleagues,
} from "../../hooks/useRequest";
import { Button, Input, Select } from "antd";
import styles from "./index.module.scss";
import { useMyContext } from "../../hooks/useContext";
import DateSelect from "../Action";
import Table, { ColumnsType } from "antd/es/table";
import { YOU } from "../../constants";
import { debounce } from "../../utils";

interface Props {
  keyId: string;
}

const AllowanceList = ({ keyId }: Props) => {
  const { storage, updateStorage } = useMyContext();
  const { list } = storage;
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<
    { name: string; customer_code: string }[]
  >([]);
  const [search, setSearch] = useState<string>();
  const [colleague, setColleague] = useState<string>();
  const userList = useMemo(() => {
    return (
      list?.groups
        .find((item: any) => item.key === keyId)
        ?.list?.filter((item: any) => item) || []
    );
  }, [list?.groups]);

  const participants = useGetParticipants(userList) ?? new Map();

  const idList = useMemo(() => {
    return Array.from(participants.keys());
  }, [participants]);

  const [allowanceList, loading] = useGetAllowanceList(idList);

  const onSearchAdd = (value: string) => {
    if (!value) return;
    const groups = list?.groups.map((item: any) => {
      if (item?.key === keyId) {
        return {
          ...item,
          list: [...new Set([...(item?.list ?? []), value])],
        };
      }
      return item;
    });
    updateStorage("list", {
      ...list,
      groups,
    });
    setSearch("");
    setColleague("");
  };

  const onDelete = (key: string) => {
    const groups = list?.groups.map((item: any) => {
      if (item?.key === keyId) {
        return {
          ...item,
          list: item?.list?.filter((item: any) => item !== key),
        };
      }
      return item;
    });
    updateStorage("list", {
      ...list,
      groups,
    });
  };

  const onSelectSearch = (value: string) => {
    setSearch(value);
  };

  const debounceSearch = debounce(onSelectSearch, 500);

  const dataSource = useMemo(() => {    
    return allowanceList?.map((item) => ({
      name: participants.get(item.customer_code)?.name ?? "You",
      key: participants.get(item.customer_code)?.key, // for delete
      ...item,
    })) ?? [];
  }, [allowanceList])

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      setSelectedRows(selectedRows);
      setSelectedRowKeys(selectedRowKeys);
      console.log(
        `selectedRowKeys: ${selectedRowKeys}`,
        "selectedRows: ",
        selectedRows
      );
    },
  };

  const request = useInitialGroup(
    selectedRows.filter((item) => item.name !== YOU)
  );

  const columns: ColumnsType<any> = [
    {
      title: "Name",
      dataIndex: "name",
      width: "30%",
    },
    {
      title: "Code",
      dataIndex: "customer_code",
    },
    {
      title: "Allowance",
      dataIndex: "allowance",
    },
    {
      title: "Operation",
      dataIndex: "operation",
      render: (_: any, record: any) => (
        <div>
          <Button
            disabled={record.name === YOU}
            type="link"
            onClick={() => onDelete(record.key)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const colleaguesList = useSearchColleagues(search);

  const options = colleaguesList
    ?.filter((o) => !Array.from(participants.keys()).includes(o.customer_code))
    .map((item) => ({
      value: item.email,
      label: `${item.first_name} ${item.last_name}`,
    }));

  useEffect(() => {
    setSelectedRowKeys(allowanceList.map((item) => item.customer_code));
    setSelectedRows(dataSource)
  }, [allowanceList]);

  return (
    <div className={styles.wrapper}>
      <DateSelect onAdd={request} />
      <Table
        rowSelection={rowSelection}
        rowKey={"customer_code"}
        bordered
        size="small"
        columns={columns}
        dataSource={[...dataSource]}
        pagination={false}
        scroll={{ y: 250 }}
        loading={loading}
      />
      <div className={styles.footer}>
        Total{" "}
        {allowanceList
          ?.filter((item) => selectedRowKeys.includes(item.customer_code))
          ?.reduce((prev, curr) => prev + curr.allowance, 0)
          ?.toFixed(2)}
        <Select
          showSearch
          className={styles.search}
          value={colleague}
          onSearch={debounceSearch}
          placeholder="Type to search people"
          onChange={onSearchAdd}
          options={options}
        />
      </div>
    </div>
  );
};

export default AllowanceList;
