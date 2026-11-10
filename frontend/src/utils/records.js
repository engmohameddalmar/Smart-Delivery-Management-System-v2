export const recordId = (record) => record?._id || record?.id || null;
export const numberOrZero = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
export const money = (value) => `$${numberOrZero(value).toFixed(2)}`;
