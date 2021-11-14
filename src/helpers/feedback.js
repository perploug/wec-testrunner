module.exports = function (message, type = "") {
  let icon = " ";
  switch (type) {
    case "info":
      icon = "ℹ️";
      break;
    case "success":
      icon = "✅";
      break;
    case "error":
      icon = "❌";
      break;
    case "warning":
      icon = " ";
      break;
    default:
      break;
  }

  console.log(` ${icon}   ${message}`);
};
