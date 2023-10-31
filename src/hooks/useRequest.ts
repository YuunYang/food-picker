import axios from "axios";
import { ADDRESS, ADD_PARTICIPANTS, ALLOWANCE, GET_COLLEAGUES, GET_GROUP_DETAILS, GROUPIE_CART } from "../constants/url";
import { useEffect, useMemo, useRef, useState } from "react";
import { AllowanceRes, ColleaguesRes, Address, Group_Detail, ListItem, Storage } from "../types";
import { useMyContext } from "./useContext";
import { sendMessagePromise } from "../utils";

const getRequestHeaders = (token: string) => {
  return {
    'Authorization': `Bearer ${token}`,
    'X-Fp-Api-Key': 'corporate',
    'X-Pd-Language-Id': '1',
  }
}

const getParticipant = async (params: {
  query: string; date: string; token: string; referenceId?: number
}) => {
  const { query, date, token, referenceId } = params;
  const headers = getRequestHeaders(token)
  const { data } = await axios.get<{ data: ColleaguesRes[] }>(GET_COLLEAGUES, {
    params: {
      query,
      expedition: 'delivery',
      order_time: date,
      corporate_reference_id: `${referenceId ?? 120145}`
    },
    headers
  });
  return data.data;
}

const updateGroup = (list: Storage['list'], data: ListItem): Storage['list'] => {
  if (!list) {
    return list;
  }
  return {
    ...list,
    groups: list?.groups.map((item) => {
      return {
        ...item,
        colleagues: item.colleagues.map(listItem => {
          if (listItem.email === data.email) {
            return {
              ...listItem,
              ...data
            };
          }
          return listItem;
        })
      }
    }) ?? []
  }
}

const useGroupieCart = (participantMap: ListItem[]) => {
  const [id, groupOrderId] = useGetIdAndGroupId()

  const request = () => Promise.all(participantMap.map(async (participant) => {
    if(!participant.token) return;
    const reqBody = {
      groupie_id: groupOrderId,
      customer_name: participant.realName,
      products: []
    };
    const headers = getRequestHeaders(participant.token)
    await axios.post(GROUPIE_CART, reqBody, { headers })
  }))
  return request
}

export const getAddress = (token: string) => {
  const headers = getRequestHeaders(token)
  return axios.get<{ data: { items: Address[] } }>(ADDRESS, {
    headers
  }).then(({ data }) => {
    const list = data?.data?.items;
    const corporate_reference_id = list.find((address) => address.corporate_reference_id)?.corporate_reference_id
    return corporate_reference_id;
  })
}

export const useGetIdAndGroupId = (): [number, string] => {
  const [groupId, setGroupId] = useState('');
  const [id, setId] = useState<number>(0);
  useEffect(() => {
    (async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const id = tabs?.[0].id;
      if (!id) return
      setId(id);
      const resp = await sendMessagePromise(id, { type: 'GET_GROUP_ID' })
      const groupOrderId = resp?.groupOrderId;
      setGroupId(groupOrderId);
    })()
  }, [])
  return [id, groupId]
}

export const useGetParticipants = () => {
  const { date, storage, updateStorage } = useMyContext()
  const { token, referenceId, list } = storage;
  const currentKey = list?.key || ''
  const queryRef = useRef<string[]>([])
  const queries = useMemo(() => {
    const currentQueries = list?.groups.find(item => item.key === currentKey)?.colleagues?.map(item => {
      return item.customer_code || item.email
    });
    const allEqual = currentQueries?.length === queryRef.current.length 
      && currentQueries?.every(item => queryRef.current.includes(item));
    if (allEqual) {
      return queryRef.current
    }
    queryRef.current = currentQueries ?? [];
    return currentQueries
  }, [currentKey, list?.groups]);

  useEffect(() => {
    if (!token || !referenceId || !queries?.length) return
    let nextList = list;
    Promise.all([...queries]?.map(async (item) => {
      if (!item) return;
      await getParticipant({
        query: item,
        date: date.format(),
        token,
        referenceId
      }).then(resp => {
        const participant = resp[0];
        const realName = `${participant.last_name} ${participant.first_name}`;
        const allowance = participant.allowance
        const email = participant.email
        const customer_code = participant.customer_code
        nextList = updateGroup(nextList, {
          realName,
          allowance,
          email,
          customer_code
        })
      });
    })).then(() => {
      updateStorage('list', nextList)
    })
  }, [date, referenceId, token, queries])
}

export const useGetHostAllowance = (defaultToken?: string) => {
  const { date, storage, updateStorage } = useMyContext()
  const { token, referenceId, host } = storage;
  useEffect(() => {
    if (!token) return
    const headers = getRequestHeaders(token)
    axios.get<{ data: AllowanceRes[] }>(ALLOWANCE, {
      params: {
        fulfilment_time: date.format(),
        participants: '',
        vertical: 'restaurants',
        expedition_type: 'delivery',
        company_location_id: referenceId
      },
      headers
    }).then(({ data }) => {
      const item = data?.data[0];
      updateStorage('host', {
        ...host,
        allowance: item?.allowance
      })
    })
  }, [date, referenceId, token])
}

export const useInitialGroup = (participantMap: ListItem[]) => {
  const { storage } = useMyContext()
  const { token } = storage;
  const [id, groupOrderId] = useGetIdAndGroupId()
  const requestCart = useGroupieCart(participantMap);
  if (!token) return;
  const headers = getRequestHeaders(token);


  const request = async () => {

    if (!id) return

    const reqBody = {
      groupie_id: groupOrderId,
      participants: participantMap.map((participant) => {
        return {
          name: participant.realName,
          code: participant.customer_code,
        };
      }),
    };

    await axios.post(ADD_PARTICIPANTS, reqBody, { headers })
    await requestCart();

    chrome.tabs.reload(id);
  }
  return request
}

export const useSearchColleagues = (query?: string) => {
  // this is to format stored data
  const [list, setList] = useState<ColleaguesRes[]>([])
  const { date, storage } = useMyContext()
  const { token, referenceId } = storage;
  useEffect(() => {
    if (!token || !query || !referenceId) {
      setList([])
      return
    }
    getParticipant({
      query,
      date: new Date(date.format()).toISOString(),
      token,
      referenceId,
    }).then((data) => {
      setList(data);
    })
  }, [query, referenceId])

  return list;
}

export const useGetGroupDetails = (groupId: string) => {
  const { storage } = useMyContext()
  const { token } = storage;
  const [groupDetail, setGroupDetail] = useState<Group_Detail>()

  useEffect(() => {
    if (!groupId) return;
    if (!token) return;
    const headers = getRequestHeaders(token)
    axios.get<{ data: Group_Detail }>(`${GET_GROUP_DETAILS}/${groupId}`, {
      headers
    }).then(({ data }) => {
      const list = data?.data;
      setGroupDetail(list)
    })
  }, [groupId, token])

  return groupDetail
}

export const useVerifyToken = () => {
  const { date, storage } = useMyContext()
  const { referenceId } = storage;
  const verify = async (token?: string, code?: string) => {
    if (!token) return
    const headers = getRequestHeaders(token)
    try {
      const { data } = await axios.get<{ data: AllowanceRes[] }>(ALLOWANCE, {
        params: {
          fulfilment_time: date.format(),
          participants: '',
          vertical: 'restaurants',
          expedition_type: 'delivery',
          company_location_id: referenceId
        },
        headers
      })
      const item = data?.data[0];
      return item.customer_code === code;
    } catch (error) {
      return false
    }
  }
  return verify;
}