import { Input, Space, Tabs } from "antd";
import { useEffect, useRef, useState } from "react";
import { useMyContext } from "../../hooks/useContext";
import AllowanceList from "../../components/AllowanceList";
import styles from "./index.module.scss";
import EditableValue from "../../components/EditableValue";
import { SmileOutlined } from '@ant-design/icons';
type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

const Home = () => {
  const { storage, updateStorage } = useMyContext();
  const { list } = storage;
  const [activeKey, setActiveKey] = useState<string>();
  const [items, setItems] = useState<any[]>([]);
  const newTabIndex = useRef(0);
  const [value, setValue] = useState("");

  const onNameChange = (key: string, name: string) => {
    const groups = list?.groups.map((item: any) => {
      if (item?.key === key) {
        return {
          ...item,
          name,
        };
      }
      return item;
    });
    updateStorage("list", {
      ...list,
      key,
      groups,
    });
  };

  useEffect(() => {
    if (list) {
      setActiveKey(list.key);
      setItems(
        list?.groups?.map((item) => ({
          label: (
            <EditableValue
              value={item.name}
              onChange={(value) => onNameChange(item.key, value)}
            />
          ),
          key: item.key,
          children: <AllowanceList key={item.key} keyId={item.key} />,
        }))
      );
    }
  }, [list]);

  const onChange = (newActiveKey: string) => {
    updateStorage("list", {
      ...list,
      key: newActiveKey,
    });
  };

  const add = () => {
    const key = `${Math.random()}+${newTabIndex.current++}`;
    updateStorage("list", {
      ...list,
      key,
      groups: [...(list?.groups ?? []), { key, name: value, colleagues: [] }],
    });
    setValue("");
  };

  const remove = (targetKey: TargetKey) => {
    const groups = list?.groups.filter((item: any) => item.key !== targetKey);
    updateStorage("list", {
      ...list,
      key: list?.key === targetKey ? groups?.[0]?.key : list?.key,
      groups,
    });
  };

  const onEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: "add" | "remove"
  ) => {
    if (action === "add") {
      add();
    } else {
      remove(targetKey);
    }
  };

  const Search = (
    <Space.Compact className={styles.search} style={{ width: "100%" }}>
      <Input.Search
        placeholder="Type a group name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSearch={add}
        enterButton={"Add"}
      />
    </Space.Compact>
  );

  return (
    <div className={styles.home}>
      {items?.length > 0 ? (
        <Tabs
          tabBarExtraContent={{
            right: Search,
          }}
          hideAdd
          type="editable-card"
          onChange={onChange}
          activeKey={activeKey}
          onEdit={onEdit}
          items={items}
        />
      ) : (
        <div>
          {Search}
          <div style={{ textAlign: "center" }}>
            <SmileOutlined style={{ fontSize: 20 }} rev={undefined} />
            <p>Add a group to start ordering</p>
            <p>Have a nice day : )</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
