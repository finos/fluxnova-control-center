export interface StartProcessDefinitionOptions {
  processDefinitionId?: string;
  confirmButtonLabel?: string;
  cancelButtonLabel?: string;
  businessKey?: string;
  title?: string;
  message?: string;
  jsonValue?: string;
  typeOptions?: { value: string; name: string }[];
  instanceId?: string;
}
