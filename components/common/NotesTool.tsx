import { useState, useEffect } from 'react'
import {
  ActionIcon,
  Button,
  Collapse,
  CopyButton,
  Drawer,
  Group,
  Pagination,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core'
import {
  IconCheck,
  IconCopy,
  IconEye,
  IconNetwork,
  IconNote,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import { useLiveQuery } from 'dexie-react-hooks'
import { notesDb, notesManager, INote } from '@/storage/notesDatabase'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'

const PAGE_SIZE = 5

export default function NotesTool() {
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  const [searchQuery, setSearchQuery] = useState('')
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newNote, setNewNote] = useState('')
  const [page, setPage] = useState(1)

  const allNotes = useLiveQuery(
    () => notesDb.notes.orderBy('id').reverse().toArray(),
    []
  )

  // Filter notes by search
  const filtered = (allNotes || []).filter((note) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(q) ||
      note.note.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const handleAdd = async () => {
    if (!newTitle.trim() || !newNote.trim()) {
      notifications.show({
        title: 'Missing fields',
        message: 'Both title and note are required.',
        color: 'orange',
      })
      return
    }
    try {
      await notesManager.create({
        title: newTitle.trim(),
        note: newNote.trim(),
        createdAt: new Date().toISOString(),
      })
      setNewTitle('')
      setNewNote('')
      setAddFormOpen(false)
      notifications.show({
        title: 'Note saved',
        message: `"${newTitle.trim()}" added.`,
        color: 'green',
      })
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to save note.',
        color: 'red',
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await notesManager.delete(id)
      notifications.show({
        title: 'Deleted',
        message: 'Note removed.',
        color: 'gray',
      })
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete note.',
        color: 'red',
      })
    }
  }

  const openNote = (note: INote) => {
    return modals.open({
      title: note.title,
      centered: true,
      radius: 'lg',
      size: 'md',
      overlayProps: {
        color: isDark ? theme.colors.dark[9] : theme.colors.gray[2],
        opacity: 0.8,
        blur: 3,
      },
      children: (
        <Stack>
          <Text size="sm" ff="monospace" c="dimmed" style={{
            wordBreak: "break-all"
          }}>
            {note.note}
          </Text>
          <Group justify="right">
            <CopyButton value={note.note}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy note'} withArrow position="top">
                  <Button
                    variant="outline"
                    size="xs"
                    radius={"md"}
                    color={copied ? 'green' : 'blue'}
                    onClick={copy}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Stack>
      ),
    })
  }

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        Save quick notes — token addresses, contract hashes, labels, etc.
      </Text>

      {/* Search + Add button */}
      <Group gap={6} align="center">
        <TextInput
          size="xs"
          radius="md"
          placeholder="Search notes..."
          leftSection={<IconSearch size={13} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <Tooltip label={addFormOpen ? 'Cancel' : 'Add note'} withArrow position="left">
          <ActionIcon
            variant={addFormOpen ? 'filled' : 'light'}
            color={addFormOpen ? 'red' : 'teal'}
            size="md"
            radius="md"
            onClick={() => setAddFormOpen((v) => !v)}
          >
            {addFormOpen ? <IconX size={14} /> : <IconPlus size={14} />}
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Add note form (collapsible) */}
      <Collapse in={addFormOpen} transitionDuration={200}>
        <Stack
          gap={6}
          p="xs"
          style={{
            border: `1px solid ${isDark ? theme.colors.darkColor[5] : theme.colors.gray[3]}`,
            borderRadius: theme.radius.md,
            background: isDark ? theme.colors.darkColor[7] : theme.colors.gray[0],
          }}
        >
          <TextInput
            size="xs"
            radius="md"
            placeholder="Title (e.g. USDC Token)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <TextInput
            size="xs"
            radius="md"
            placeholder="Note (e.g. 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            ff="monospace"
          />
          <Button
            size="xs"
            radius="md"
            variant="filled"
            color="teal"
            leftSection={<IconPlus size={13} />}
            onClick={handleAdd}
            disabled={!newTitle.trim() || !newNote.trim()}
            fullWidth
          >
            Save Note
          </Button>
        </Stack>
      </Collapse>

      {/* Notes table */}
      <DataTable
        withTableBorder
        fz="xs"
        minHeight={120}
        borderRadius="md"
        bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[0]}
        fetching={!allNotes}
        records={paginated}
        idAccessor="id"
        noRecordsText="No notes yet"
        columns={[
          {
            accessor: 'actions',
            title: '',
            width: 70,
            render: (record: INote) => (
              <Group gap={4} wrap="nowrap">
                <CopyButton value={record.note}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy note'} withArrow position="top">
                      <ActionIcon
                        variant="subtle"
                        size="xs"
                        color={copied ? 'green' : 'gray'}
                        onClick={copy}
                      >
                        {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  color="blue"
                  onClick={() => openNote(record)}
                >
                  <IconEye size={13} />
                </ActionIcon>
                <Tooltip label="Delete" withArrow position="top">
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    color="red"
                    onClick={() => handleDelete(record.id!)}
                  >
                    <IconTrash size={13} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ),
          },
          {
            accessor: 'title',
            title: 'Title',
            render: (record: INote) => (
              <Text size="xs" fw={500} lineClamp={1}>
                {record.title}
              </Text>
            ),
          },
          {
            accessor: 'note',
            title: 'Note',
            render: (record: INote) => (
              <Text size="xs" ff="monospace" c="dimmed" truncate="end" maw={120}>
                {record.note}
              </Text>
            ),
          },
        ]}
        styles={{
          header: {
            fontSize: '10px',
          },
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination
            size="xs"
            radius="md"
            total={totalPages}
            value={page}
            onChange={setPage}
          />
        </Group>
      )}
    </Stack>
  )
}



export const NotesButton = () => {
  const [opened, { toggle }] = useDisclosure(false);
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  return (
    <>
      <ActionIcon hiddenFrom={"md"} size={"md"} radius={"xl"} color={"yellow"} variant="filled" onClick={toggle} style={{ marginRight: 4 }}>
        <IconNote size={14} />
      </ActionIcon>
      <Button visibleFrom='md' variant='outline' size="xs" px={"lg"} radius="xl" color='yellow' onClick={toggle} rightSection={<IconNote size={14} />}>
        Notes
      </Button>
      <Drawer
        position='right'
        title={"Notes"}
        opened={opened}
        onClose={toggle}
        size={"lg"}
        offset={10}
        radius={"lg"}
      >
        <Drawer.Body p={0} h="calc(100vh - 100px)">
          <ScrollArea h="100%" style={{ overflowX: 'hidden' }}>
            <NotesTool />
          </ScrollArea>
        </Drawer.Body>
      </Drawer>
    </>
  )
}
