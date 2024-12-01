import { EStorageKeys } from "@/constants/storageKeys"

export const authHeader = () => {
  let token = JSON.parse(localStorage.getItem(EStorageKeys.TOKEN)!)
  return { Authorization: 'Bearer ' + token }
}

