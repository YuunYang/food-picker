```javascript
// ==UserScript==
// @auth         Tangting
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.foodpanda.sg/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

const token = "Bearer (Fill you own token)";

const getParticipant = async (query) => {
  const date = encodeURIComponent(new Date().toISOString());
  const url = `https://sg.fd-api.com/api/v5/corporate-api/users/colleagues?query=${query}&expedition_type=delivery&order_time=${date}&corporate_reference_id=120050`;
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: token,
      "X-Fp-Api-Key": "corporate",
      "X-Pd-Language-Id": 1,
    },
  });
  const dataJson = await resp.text();
  const data = JSON.parse(dataJson).data;
  return data;
};

const getParticipants = async () => {
  const searchKeys = [];

  const participantMap = new Map();
  for (const key of searchKeys) {
    const resp = await getParticipant(key);
    if (resp) {
      const participant = resp[0];
      participant.name = `${participant.last_name} ${participant.first_name}`;
      participantMap.set(participant.customer_code, participant);
    }
  }
  return participantMap;
};

(async function () {
  const participantMap = await getParticipants();
  const groupOrderOtp = JSON.parse(localStorage.groupOrderOtp);
  const groupOrderId = groupOrderOtp?.groupOrderId;
  console.log("groupOrderId", groupOrderId);
  if (!groupOrderId) {
    return;
  }

  const data = {
    groupie_id: groupOrderId,
    participants: Array.from(participantMap.values()).map((participant) => {
      return {
        name: participant.name,
        code: participant.customer_code,
      };
    }),
  };

  console.log(data);

  const url = `https://sg.fd-api.com/api/v5/groupie/add_participants`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "X-Fp-Api-Key": "corporate",
      "X-Pd-Language-Id": 1,
    },
    body: JSON.stringify(data),
  });
  console.log(resp);
})();

const request = {
  host: { name, code },
  vendor: { name, code },
  expedition_type,
  fulfilment_time,
  fulfilment_time_text,
  fulfilment_address,
};
```