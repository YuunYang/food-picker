import React, { useMemo, useState } from "react";
import {
  useGetHostAllowance,
  useGetParticipants,
  useInitialGroup,
  useSearchColleagues,
} from "../../hooks/useRequest";
import { Button, Input, Popconfirm, Select } from "antd";
import styles from "./index.module.scss";
import { useMyContext } from "../../hooks/useContext";
import DateSelect from "../Action";
import Table, { ColumnsType } from "antd/es/table";
import { YOU } from "../../constants";
import { debounce } from "../../utils";
import { Group } from "../../types";

interface Props {
  keyId: string;
}

const AllowanceList = ({ keyId }: Props) => {
  const { storage, updateStorage } = useMyContext();
  const { list, host } = storage;
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<
    { name: string; customer_code: string }[]
  >([]);
  const [search, setSearch] = useState<string>();
  const [colleague, setColleague] = useState<string>();
  const [token, setToken] = useState<string>();
  const userList = useMemo(() => {
    return (
      list?.groups
        .find((item: any) => item.key === keyId)
        ?.colleagues?.filter((item: any) => item) || []
    );
  }, [list?.groups]);

  useGetParticipants();
  useGetHostAllowance()

  const onSearchAdd = (value: string, option: any) => {
    if (!value) return;
    const groups: Group[] | undefined = list?.groups.map((item: any) => {
      if (item?.key === keyId) {
        return {
          ...item,
          colleagues: [
            ...new Set([
              ...(item?.colleagues ?? []),
              {
                realName: option.realName,
                email: value,
                token: "",
                customer_code: option.customer_code,
              },
            ]),
          ],
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
    const groups: Group[] | undefined = list?.groups.map((item: any) => {
      if (item?.key === keyId) {
        return {
          ...item,
          colleagues: item?.colleagues?.filter(
            (item: any) => item.customer_code !== key
          ),
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

  const onAddToken = (key: string) => {
    const groups: Group[] | undefined = list?.groups.map((item) => {
      if (item?.key === keyId) {
        return {
          ...item,
          colleagues: item?.colleagues.map((colleagueItem) => {
            if (colleagueItem.customer_code === key) {
              return {
                ...colleagueItem,
                token,
              };
            }
            return colleagueItem;
          }),
        };
      }
      return item;
    });
    updateStorage("list", {
      ...list,
      groups,
    });
    setToken("");
  };

  const debounceSearch = debounce(onSelectSearch, 500);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      setSelectedRows(selectedRows);
      setSelectedRowKeys(selectedRowKeys);
    },
    getCheckboxProps: (record: any) => ({
      disabled: !!userList.find(
        (item) => item.token === "" && item.customer_code === record.customer_code
      ),
      name: record.name,
    }),
  };

  const request = useInitialGroup(
    selectedRows.filter((item) => item.name !== YOU)
  );

  const columns: ColumnsType<any> = [
    {
      title: "Name",
      dataIndex: "realName",
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
      title: "Token",
      dataIndex: "token",
      render: (_: any, record: any) => (
        <div>
          <Popconfirm
            title={record?.token ? "Update Token" : "Add Token"}
            description={
              <Input value={token} onChange={(e) => setToken(e.target.value)} />
            }
            onConfirm={() => onAddToken(record.customer_code)}
            icon={null}
          >
            <Button
              disabled={record.name === YOU}
              type={record?.token ? "primary" : "dashed"}
            >
              {record?.token ? "Update" : "Add"}
            </Button>
          </Popconfirm>
        </div>
      ),
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
    ?.filter(
      (o) =>
        !Array.from(userList.map((item) => item.customer_code)).includes(
          o.customer_code
        )
    )
    .map((item) => ({
      value: item.email,
      customer_code: item.customer_code,
      realName: `${item.first_name} ${item.last_name}`,
      label: `${item.first_name} ${item.last_name}`,
    }));

  return (
    <div className={styles.wrapper}>
      <DateSelect onAdd={request} />
      <Table
        rowSelection={rowSelection}
        rowKey={"customer_code"}
        bordered
        size="small"
        columns={columns}
        dataSource={userList}
        pagination={false}
        scroll={{ y: 250 }}
        // loading={loading}
      />
      <div className={styles.footer}>
        Total{" "}
        {userList
          ?.filter((item) => selectedRowKeys.includes(item.customer_code ?? ""))
          ?.reduce((prev, curr) => prev + (curr.allowance ?? 0), host?.allowance ?? 0)
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
