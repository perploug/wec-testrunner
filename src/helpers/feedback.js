module.exports = function (message, type = "") {
  let icon = " ";
  switch (type) {
    case "info":
      icon = "âšī¸";
      break;
    case "success":
      icon = "â";
      break;
    case "error":
      icon = "â";
      break;
    case "warning":
      icon = " ";
      break;
    default:
      break;
  }

  console.log(` ${icon}   ${message}`);
};
