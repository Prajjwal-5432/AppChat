const socket = io();

const $messageForm = document.getElementById("text-form");
const $messageFormInput = document.getElementById("text");
const $messageFormButton = document.querySelector("#text-form > button");
const $locationButton = document.getElementById("send-location");
const $messages = document.getElementById("messages");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = $messages.offsetHeight;
  const containerHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", ({ username, message, createdAt }) => {
  console.log(message, createdAt);
  const html = Mustache.render(messageTemplate, {
    message,
    createdAt: moment(createdAt).format("h:mm A"),
    username,
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", ({ username, url, createdAt }) => {
  console.log(url, createdAt);
  const html = Mustache.render(locationTemplate, {
    url,
    createdAt: moment(createdAt).format("h:mm A"),
    username,
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  console.log(room, users);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.getElementById("sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const msg = $messageFormInput.value;
  socket.emit("sendMessage", msg, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("Message delivered successfully");
  });
});

$locationButton.addEventListener("click", (e) => {
  $locationButton.setAttribute("disabled", "disabled");

  if (!navigator.geolocation) {
    return alert("Geolocation is not available");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        console.log("Location shared!");
        $locationButton.removeAttribute("disabled");
      }
    );
  });
});

socket.emit(
  "join",
  {
    username,
    room,
  },
  (error) => {
    if (error) {
      alert(error);
      location.href = "/";
    }
  }
);
