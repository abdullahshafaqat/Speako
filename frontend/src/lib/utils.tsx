export function formatMessageTime(date: string | number | Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    timeZone: "Asia/Karachi",  
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,               
  });
}
