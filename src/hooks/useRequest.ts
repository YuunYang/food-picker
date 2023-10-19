import axios from "axios";
import { ADDRESS, ADD_PARTICIPANTS, ALLOWANCE, GET_COLLEAGUES, GROUP_INITIATE, VENDOR } from "../constants/url";
import { useEffect, useState } from "react";
import { AllowanceRes, ColleaguesRes, Address } from "../types";
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
  const { data } = await axios.get(GET_COLLEAGUES, {
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

export const useGetParticipants = (list: string[]) => {
  const { date, storage } = useMyContext()
  const { token, host, referenceId } = storage;

  const [participantMap, setParticipantMap] = useState<Map<string, any>>(new Map([
    [host?.code || '', host?.name || '']
  ]));
  useEffect(() => {
    const map = new Map();
    Promise.all(list.map(async (key) => {
      if (!token || !referenceId) return
      const resp = await getParticipant({
        query: key,
        date: date.format(),
        token,
        referenceId
      });
      if (resp) {
        const participant = resp[0];
        const name = `${participant.last_name} ${participant.first_name}`
        map.set(participant.customer_code, { name, key })
        return name
      }
      return;
    })).then(() => {
      setParticipantMap(map)
    })
  }, [date, list, referenceId, token])

  return participantMap;
}

export const useGetAllowanceList = (idList: string[]): [AllowanceRes[], boolean] => {
  const [list, setList] = useState<AllowanceRes[]>([])
  const [loading, setLoading] = useState(false);
  const { date, storage } = useMyContext()
  const { token, referenceId } = storage;
  console.log(referenceId)
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
  if (!token) return;
  const headers = getRequestHeaders(token);

  const request = async () => {
    const { data: vendorData } = await axios.get(`${VENDOR}/${vendorCode}`)
    const vendorName = vendorData?.data?.name
  
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const id = tabs?.[0].id;
    const groupOrderUrl = tabs?.[0].url;
    if (!id) return
    let groupOrderId;
    const resp = await sendMessagePromise(id, { type: 'GET_GROUP_ID' })
    groupOrderId = resp?.groupOrderId;

    if(!groupOrderId) {
      const { data } = await axios.post(GROUP_INITIATE, {
        host,
        vendor: {
          name: vendorName,
          code: vendorCode
        },
        fulfilment_time: new Date(date.format()).toISOString(),
        fulfilment_time_text: `Delivery ${date.format('ddd DD, HH:mm')}`,
        expedition_type: "delivery",
        fulfilment_address: "Marina Boulevard, MBFC 3, #13-01 Singapore 018982",
        additional_parameters: {
          address: {
            "id": 31062756,
            "city_id": 1,
            "city": "Singapore",
            "city_name": null,
            "area_id": null,
            "areas": null,
            "address_line1": "Marina Boulevard, MBFC 3, #13-01",
            "address_line2": null,
            "address_line3": null,
            "address_line4": null,
            "address_line5": null,
            "address_other": "#13-01, Marina Boulevard, MBFC 3, Singapore 018982",
            "room": null,
            "flat_number": null,
            "structure": null,
            "building": "MBFC Tower 3",
            "intercom": null,
            "entrance": null,
            "floor": "#13-01",
            "district": null,
            "postcode": "018982",
            "meta": null,
            "company": "OKG",
            "longitude": 103.8544967,
            "latitude": 1.2790221,
            "is_delivery_available": true,
            "delivery_instructions": null,
            "title": null,
            "label": null,
            "formatted_customer_address": "Marina Boulevard, MBFC 3, #13-01 Singapore 018982",
            "campus": "OKG Level 13",
            "corporate_reference_id": referenceId || 120145,
            "form_id": null,
            "country_code": "SG",
            "created_at": "2023-03-01T08:22:16Z",
            "updated_at": "2023-05-16T10:06:35Z",
            "location_type": "polygon",
            "object_type": "saved address",
            "type": "5",
            "phone_country_code": null,
            "phone_number": null,
            "formatted_address": null,
            "is_same_as_requested_location": null,
            "block": null
          },
          is_order_on_behalf: true
        }
      }, {
        headers
      })
  
      groupOrderId = data?.data?.groupie_id;
  
      await chrome.tabs.sendMessage(id, { type: 'SET_GROUP_ID', groupOrderId, groupOrderUrl })
    }

    const reqBody = {
      groupie_id: groupOrderId,
      participants: Array.from(participantMap).map((participant) => {
        return {
          name: participant.name,
          code: participant.customer_code,
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
    console.log(corporate_reference_id)
    return corporate_reference_id;
  })
}