<script setup lang="ts">
defineProps<{ id: string }>()
</script>

<template>
  <section>
    <h1>Planet {{ id }}</h1>
  </section>
</template>
