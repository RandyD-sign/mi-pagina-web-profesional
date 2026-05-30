const controlMenu = document.querySelector("#control-menu");
const enlacesMenu = document.querySelectorAll(".panel-menu a");

enlacesMenu.forEach((enlace) => {
  enlace.addEventListener("click", () => {
    if (controlMenu) {
      controlMenu.checked = false;
    }
  });
});
