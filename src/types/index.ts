import dayjs from "dayjs";

export interface ListItem {
  realName: string,
  email: string,
  customer_code?: string,
  token?: string,
  allowance?: number
}

export interface Group {
  name: string; 
  key: string; 
  colleagues: ListItem[];
  list?: ListItem[]
}
export interface Storage {
  token?: string;
  host?: ListItem;
  list?: {
    key: string;
    groups: Group[];
  };
  enableNote?: boolean;
  referenceId?: number;
}

export type MyContextType = {
  tab?: chrome.tabs.Tab;
  setTab: React.Dispatch<React.SetStateAction<chrome.tabs.Tab | undefined>>;
  date: dayjs.Dayjs;
  setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
  storage: Storage;
  updateStorage: (key: keyof Storage, value: any) => void;
  vendorCode: string;
  setVendorCode: React.Dispatch<React.SetStateAction<string>>;
};

export interface AllowanceRes {
  allowance: number;
  customer_code: string;
  is_required_expense_code: boolean;
  is_allowance_available: boolean;
}

export interface ColleaguesRes {
  email: string;
  first_name: string;
  last_name: string;
  customer_code: string;
  allowance: number;
}

export interface Address {
  id: number;
  city_id: number;
  city: string;
  city_name: null;
  area_id: null;
  areas: null;
  address_line1: string;
  address_line2: null | string;
  address_line3: null;
  address_line4: null;
  address_line5: null;
  address_other: null | string;
  room: null;
  flat_number: null;
  structure: null;
  building: null | string;
  intercom: null;
  entrance: null;
  floor: string;
  district: null;
  postcode: string;
  meta: null | string;
  company: null | string;
  longitude: number;
  latitude: number;
  is_delivery_available: boolean;
  formatted_customer_address: string;
  delivery_instructions: null;
  title: null;
  type: number;
  label: null | string;
  formatted_address: null;
  is_same_as_requested_location: null;
  campus: null | string;
  corporate_reference_id: number | null;
  form_id: null | string;
  country_code: string;
  created_at: Date;
  updated_at: Date;
  phone_number: null;
  phone_country_code: null;
  block: null;
  property_type: null;
}

export interface Group_Detail {
  order_code: string;
  host: Host;
  guests: Guest[];
  vendor: Host;
  expedition_type: string;
  expedition_time_text: string;
  fulfilment_address: string;
  fulfilment_time: Date;
  fulfilment_time_text: string;
  fulfilment_type: string;
  corporate: Corporate;
  additional_parameters: AdditionalParameters;
  updated_at: Date;
  last_sync_time: Date;
  state: string;
}

export interface AdditionalParameters {
  address: Address;
}

export interface Corporate {
  company_id: number;
  company_name: string;
  location_id: number;
  is_split_allowance: boolean;
}

export interface Guest {
  name: string;
  code: string;
  updated_at: Date;
  state: string;
}

export interface Host {
  name: string;
  code: string;
}
