<script setup lang="ts">
import { Link, router, useForm } from '@inertiajs/vue3'

defineProps<{
  todos: { id: number, text: string, done: boolean }[]
  errors?: Record<string, string>
}>()

const form = useForm({ text: '' })

function submit() {
  form.post('/todos', { preserveScroll: true })
}

function partialReloadTodos() {
  router.get('/todos', {}, { only: ['todos'], preserveState: true, preserveScroll: true })
}

async function simulateDbWrite() {
  await fetch('/api/todos/push', { method: 'POST' })
}

function toggle(id: number) {
  router.post(`/todos/${id}/toggle`, {}, { preserveScroll: true })
}

function del(id: number) {
  router.delete(`/todos/${id}`, { preserveScroll: true })
}
</script>

<template>
  <div>
    <h1>Todos</h1>
    <form @submit.prevent="submit">
      <input
        v-model="form.text"
        type="text"
        name="text"
      >
      <button
        type="submit"
        :disabled="form.processing"
      >
        Add
      </button>
      <span
        v-if="errors?.text"
        class="err"
      >{{ errors.text }}</span>
    </form>
    <ul>
      <li
        v-for="todo in todos"
        :key="todo.id"
      >
        <label>
          <input
            type="checkbox"
            :checked="todo.done"
            @change="toggle(todo.id)"
          >
          {{ todo.text }}
        </label>
        <button
          type="button"
          @click="del(todo.id)"
        >
          ×
        </button>
      </li>
    </ul>
    <p>
      <button
        type="button"
        @click="simulateDbWrite"
      >
        + row (fetch)
      </button>
      <button
        type="button"
        @click="partialReloadTodos"
      >
        partial reload
      </button>
    </p>
    <Link href="/">
      Home
    </Link>
  </div>
</template>

<style scoped>
.err {
  color: crimson;
  margin-left: 0.5rem;
}
</style>
