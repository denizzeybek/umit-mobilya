<template>
  <router-view />
</template>

<script setup lang="ts">
console.log('test fe 2');
</script>

<style>
/* #region megamenu */
.p-megamenu {
  @apply !border-none !py-5 !px-7 !rounded-none;
}
/* #endregion */

/* #region tablist */
.p-tablist-content {
  @apply !px-5;
}
.p-tabs {
  @apply !p-0 !m-0;
}
.p-tablist-tab-list {
  @apply !w-fit !rounded-xl !border-f-gray !border !bg-f-light-gray;
}
.p-tab {
  @apply !border-transparent !text-f-dark-gray  !rounded-xl !py-3;
}
.p-tab.p-tab-active {
  @apply !bg-white !text-black !rounded-xl !border-none !transform !scale-104;
}
.p-tablist-active-bar {
  @apply !hidden;
}
.p-tabpanels {
  @apply !bg-transparent;
}
/* #endregion */

/* #region input */
.p-inputtext.p-password-input {
  @apply !w-full;
}
/*#endregion */

/* #region breadcrumb */
.p-breadcrumb {
  @apply !bg-transparent !p-0;
}
/*#endregion */

.p-button-secondary.p-button-outlined {
  @apply !bg-slate-50 !text-slate-700 !border-slate-300;
}
.p-button-secondary.p-button-outlined .p-button-icon {
  @apply !text-slate-700;
}
</style>
