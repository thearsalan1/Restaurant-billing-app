import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export function errorMessage(err: any): string {
  return err.response?.data?.message || "Cannot reach server";
}

export const money = (paise: number) => "₹" + (paise / 100).toFixed(2);
export const toPaise = (rupees: number) => Math.round(rupees * 100);

export default api;
