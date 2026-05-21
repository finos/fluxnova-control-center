// Abstracted window related actions for easier unit testing

export function windowRedirect(url: string) {
  window.location.href = url;
}

export function windowReload() {
  setTimeout(() => window.location.reload(), 2000);
}
