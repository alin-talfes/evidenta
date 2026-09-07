(function(root){
'use strict';

function schedule(receivedDate){
  if (!(receivedDate instanceof Date) || Number.isNaN(receivedDate.getTime())) return null;
  const day21 = new Date(receivedDate);
  day21.setDate(day21.getDate() + 20);
  const day22 = new Date(receivedDate);
  day22.setDate(day22.getDate() + 21);
  return { day21, day22 };
}

root.QuarantineRules = { schedule };
})(typeof window !== 'undefined' ? window : globalThis);
