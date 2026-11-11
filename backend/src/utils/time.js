const DAY = 24 * 60 * 60 * 1000;

function dayKey(date, offsetMinutes = 330) {
  return Math.floor((new Date(date).getTime() + offsetMinutes * 60000) / DAY);
}

function daysBetween(a, b) {
  return (new Date(b).getTime() - new Date(a).getTime()) / DAY;
}

module.exports = { DAY, dayKey, daysBetween };
