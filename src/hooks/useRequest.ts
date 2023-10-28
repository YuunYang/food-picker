import axios from "axios";
import { ADDRESS, ADD_PARTICIPANTS, ALLOWANCE, GET_COLLEAGUES, GET_GROUP_DETAILS } from "../constants/url";
import { useEffect, useMemo, useRef, useState } from "react";
import { AllowanceRes, ColleaguesRes, Address, Group_Detail, ListItem, Storage } from "../types";
import { useMyContext } from "./useContext";
import { sendMessagePromise } from "../utils";

const getRequestHeaders = (token: string) => {
  return {
    'Authorization': token,
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

export const useGetHostAllowance = () => {
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

export const useGetAllowanceList = (idList: string[]): [AllowanceRes[], boolean] => {
  const [list, setList] = useState<AllowanceRes[]>([])
  const [loading, setLoading] = useState(false);
  const { date, storage } = useMyContext()
  const { token, referenceId } = storage;
  useEffect(() => {
    if (!token) return
    setLoading(true)
    const headers = getRequestHeaders(token)
    axios.get<{ data: AllowanceRes[] }>(ALLOWANCE, {
      params: {
        fulfilment_time: date.format(),
        participants: idList.join(','),
        vertical: 'restaurants',
        expedition_type: 'delivery',
        company_location_id: referenceId
      },
      headers
    }).then(({ data }) => {
      setLoading(false)
      setList(data?.data);
    })
  }, [idList])

  return [list, loading];
}

export const useInitialGroup = (participantMap: { name: string, customer_code: string }[]) => {
  const { storage, vendorCode, date } = useMyContext()
  const { token, host, referenceId } = storage;
  const [id, groupOrderId] = useGetIdAndGroupId()
  if (!token) return;
  const headers = getRequestHeaders(token);


  const request = async () => {
    // const { data: vendorData } = await axios.get(`${VENDOR}/${vendorCode}`)
    // const vendorName = vendorData?.data?.name

    if (!id) return

    // if(!groupOrderId) {
    //   const { data } = await axios.post(GROUP_INITIATE, {
    //     host,
    //     vendor: {
    //       name: vendorName,
    //       code: vendorCode
    //     },
    //     fulfilment_time: new Date(date.format()).toISOString(),
    //     fulfilment_time_text: `Delivery ${date.format('ddd DD, HH:mm')}`,
    //     expedition_type: "delivery",
    //     fulfilment_address: "Marina Boulevard, MBFC 3, #13-01 Singapore 018982",
    //     additional_parameters: {
    //       address: {
    //         "id": 31062756,
    //         "city_id": 1,
    //         "city": "Singapore",
    //         "city_name": null,
    //         "area_id": null,
    //         "areas": null,
    //         "address_line1": "Marina Boulevard, MBFC 3, #13-01",
    //         "address_line2": null,
    //         "address_line3": null,
    //         "address_line4": null,
    //         "address_line5": null,
    //         "address_other": "#13-01, Marina Boulevard, MBFC 3, Singapore 018982",
    //         "room": null,
    //         "flat_number": null,
    //         "structure": null,
    //         "building": "MBFC Tower 3",
    //         "intercom": null,
    //         "entrance": null,
    //         "floor": "#13-01",
    //         "district": null,
    //         "postcode": "018982",
    //         "meta": null,
    //         "company": "OKG",
    //         "longitude": 103.8544967,
    //         "latitude": 1.2790221,
    //         "is_delivery_available": true,
    //         "delivery_instructions": null,
    //         "title": null,
    //         "label": null,
    //         "formatted_customer_address": "Marina Boulevard, MBFC 3, #13-01 Singapore 018982",
    //         "campus": "OKG Level 13",
    //         "corporate_reference_id": referenceId || 120145,
    //         "form_id": null,
    //         "country_code": "SG",
    //         "created_at": "2023-03-01T08:22:16Z",
    //         "updated_at": "2023-05-16T10:06:35Z",
    //         "location_type": "polygon",
    //         "object_type": "saved address",
    //         "type": "5",
    //         "phone_country_code": null,
    //         "phone_number": null,
    //         "formatted_address": null,
    //         "is_same_as_requested_location": null,
    //         "block": null
    //       },
    //       is_order_on_behalf: true
    //     }
    //   }, {
    //     headers
    //   })

    //   groupOrderId = data?.data?.groupie_id;

    //   await chrome.tabs.sendMessage(id, { type: 'SET_GROUP_ID', groupOrderId, groupOrderUrl: 'https://www.foodpanda.sg/' })
    // }

    const reqBody = {
      groupie_id: groupOrderId,
      participants: Array.from(participantMap).map((participant) => {
        return {
          name: participant.name,
          customer_code: participant.customer_code,
        };
      }),
    };

    await axios.post(ADD_PARTICIPANTS, reqBody, { headers })
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