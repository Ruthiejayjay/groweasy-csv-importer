export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];
export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

export interface CrmRecord {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: CrmStatus | "" | null;
  crm_note: string | null;
  data_source: DataSource | "" | null;
  possession_time: string | null;
  description: string | null;
}

export const CRM_FIELD_LIST: { field: keyof CrmRecord; description: string }[] =
  [
    { field: "created_at", description: "Lead creation date" },
    { field: "name", description: "Lead name" },
    { field: "email", description: "Primary email" },
    { field: "country_code", description: "Country code, e.g. +91" },
    {
      field: "mobile_without_country_code",
      description: "Mobile number without country code",
    },
    { field: "company", description: "Company name" },
    { field: "city", description: "City" },
    { field: "state", description: "State" },
    { field: "country", description: "Country" },
    { field: "lead_owner", description: "Lead owner" },
    {
      field: "crm_status",
      description: "Lead status - must be one of the allowed enum values",
    },
    {
      field: "crm_note",
      description: "Notes, remarks, extra emails/phones, anything else useful",
    },
    {
      field: "data_source",
      description: "Source - must be one of the allowed enum values, or blank",
    },
    { field: "possession_time", description: "Property possession time" },
    { field: "description", description: "Additional description" },
  ];
