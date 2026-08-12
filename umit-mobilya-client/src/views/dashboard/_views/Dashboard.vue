<template>
  <HomeHero />
  <HomeStatement />
  <ProjectIndex />
  <WorkshopStrip />
  <ProcessSteps />
  <MaterialNote />
</template>

<script setup lang="ts">
import MaterialNote from '@/components/ui/local/MaterialNote.vue';
import ProcessSteps from '@/components/ui/local/ProcessSteps.vue';

import HomeHero from '../_components/HomeHero.vue';
import HomeStatement from '../_components/HomeStatement.vue';
import ProjectIndex from '../_components/ProjectIndex.vue';
import WorkshopStrip from '../_components/WorkshopStrip.vue';
</script>
