export function formatMessageTime(date: string | number | Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    timeZone: "Asia/Karachi",   // Islamabad uses same PKT time zone
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,               // ✅ switch to AM/PM format
  });
}
