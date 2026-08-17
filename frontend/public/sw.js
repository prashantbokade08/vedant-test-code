self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const { title = "⏰ Todo reminder", body = "", url = "/" } = data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: data.tag || "todo-reminder",
      renotify: true,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return clients.openWindow(event.notification.data?.url || "/");
    })
  );
});