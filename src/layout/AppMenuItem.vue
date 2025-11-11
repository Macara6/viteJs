

<script setup>
import { ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
  item: { type: Object, required: true },
  index: Number
});

const isActive = ref(false);

// détecter la route active
watchEffect(() => {
  if (props.item.to) {
    isActive.value = route.path === props.item.to;
  }
});
</script>

<template>
  <li>

<router-link
  v-if="props.item.to"
  :to="props.item.to"
  class="flex items-center gap-2 p-2 rounded-md relative"
  :class="{
    'bg-green-500 text-white': isActive,
    'hover:bg-gray-100 hover:text-gray-900': !isActive
  }"
>
  <!-- Wrapper icône pour positionner le badge -->
  <div class="relative">
    <i :class="props.item.icon" class="text-xl"></i>
    <span
      v-if="props.item.badge && props.item.badge.value > 0"
      class="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
    >
      {{ props.item.badge.value }}
    </span>
  </div>

  <!-- Label -->
  <span class="ml-2">{{ props.item.label }}</span>
</router-link>


    <!-- Sous-menu -->
    <ul v-if="props.item.items" class="ml-4 mt-1">
      <app-menu-item
        v-for="(child, i) in props.item.items"
        :key="i"
        :item="child"
        :index="i"
      />
    </ul>
  </li>
</template>

<style scoped>
.relative { position: relative; }
.absolute { position: absolute; }
.-top-1 { top: -0.25rem; }
.-right-1 { right: -0.25rem; }
.text-xl { font-size: 1.25rem; }
</style>

