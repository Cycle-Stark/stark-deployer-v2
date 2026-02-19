import { formatAddress, makeFirstLetterUpperCase } from "@/utils"
import { Grid, TextInput, Select, NumberInput, JsonInput, Group, ActionIcon, Box, Paper, useMantineColorScheme, useMantineTheme, Textarea } from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"

interface ICallDataItem {
    inputType: string
    form: any
    index: any
    hideDeleteBtn?: boolean
}

export const CallDataItem = (props: ICallDataItem) => {
    const { inputType, form, index, hideDeleteBtn } = props

    const radius = "md"
    const currentItem = form.values.callData[index]

    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === 'dark'
    const theme = useMantineTheme()

    const deleteCallDataObj = (index: number) => {
        form.removeListItem("callData", index)
    }

    return (
        <Paper bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[1]} radius="md" p={"xs"}>
            <Grid>
                <Grid.Col span={{ md: hideDeleteBtn ? 12 : 11 }}>
                    <Grid>
                        {/* <Grid.Col span={{ md: 4 }}>
                        <TextInput disabled={hideDeleteBtn} radius={radius} label="Key" {...form.getInputProps(`callData.${index}.key_`)} placeholder="gurdian" />
                    </Grid.Col> */}
                        {/* <Grid.Col span={{ md: 4 }}>
                        <Select radius={radius} disabled={hideDeleteBtn} label="Type" data={[
                            { value: 'number', label: 'Number' },
                            { value: 'felt', label: 'Felt' },
                            { value: 'address', label: 'Address' },
                            { value: 'bool', label: 'Boolean' },
                            { value: 'enum', label: 'Enum' },
                            { value: 'array', label: 'Array' },
                        ]} {...form.getInputProps(`callData.${index}.valueType`)} />
                    </Grid.Col> */}
                        <Grid.Col span={{ md: 12 }} >
                            {/* {form.values.CallData[index].valueType} */}
                            {
                                inputType === 'felt' ? (
                                    <TextInput
                                        size="sm"
                                        radius={radius}
                                        label={makeFirstLetterUpperCase(currentItem.name ?? "unknown")}
                                        description={`${currentItem.type}`}
                                        {...form.getInputProps(`callData.${index}.value`)}
                                        placeholder="123456789"
                                    />
                                ) : null
                            }
                            {
                                inputType === 'address' ? (
                                    <TextInput
                                        size="sm"
                                        radius={radius}
                                        label={makeFirstLetterUpperCase(currentItem.name ?? "unknown")}
                                        description={`${currentItem.type}`}
                                        {...form.getInputProps(`callData.${index}.value`)}
                                        placeholder={formatAddress("0x050a92f70bec00badfcfb866ce216ff8f99bd5ad57654052655ece6de8acfbd6", 10, 6)}
                                    />
                                ) : null
                            }
                            {
                                inputType === 'number' ? (
                                    <NumberInput
                                        hideControls
                                        size="sm"
                                        radius={radius}
                                        label={makeFirstLetterUpperCase(currentItem.name ?? "unknown")}
                                        description={`${currentItem.type}`}
                                        {...form.getInputProps(`callData.${index}.value`)}
                                        placeholder="123456789"
                                    />
                                ) : null
                            }
                            {
                                inputType === 'bool' ? (
                                    <Select
                                        radius={radius}
                                        label={makeFirstLetterUpperCase(currentItem.name ?? "unknown")}
                                        description={`${currentItem.type}`}
                                        {...form.getInputProps(`callData.${index}.value`)} data={[
                                            { value: 'true', label: 'True' },
                                            { value: 'false', label: 'False' },
                                        ]} placeholder="True" />
                                ) : null
                            }
                            {
                                inputType === 'enum' ? (
                                    <TextInput
                                        radius={radius}
                                        label={makeFirstLetterUpperCase(currentItem.name ?? "unknown")}
                                        description={`${currentItem.type}`}
                                        {...form.getInputProps(`callData.${index}.value`)}
                                        placeholder="Category" />
                                ) : null
                            }
                            {
                                inputType === 'array' ? (
                                    <JsonInput
                                        rows={5}
                                        radius={radius}
                                        label="Value"
                                        {...form.getInputProps(`callData.${index}.value`)} placeholder="[]" />
                                ) : null
                            }
                            {
                                inputType === 'textarea' ? (
                                    <Textarea
                                        autosize
                                        size="sm"
                                        radius={radius}
                                        label={makeFirstLetterUpperCase(currentItem.name ?? "unknown")}
                                        description={`${currentItem.type}`}
                                        {...form.getInputProps(`callData.${index}.value`)}
                                        placeholder="some string information"
                                        minRows={3}
                                    />
                                ) : null
                            }
                            {
                                inputType === 'json' ? (
                                    <JsonInput
                                        size="sm"
                                        radius={radius}
                                        label={makeFirstLetterUpperCase(currentItem.name ?? "unknown")}
                                        description={`${currentItem.type}`}
                                        {...form.getInputProps(`callData.${index}.value`)}
                                        placeholder={JSON.stringify([{ "key": "value" }], null, 4)}
                                    />
                                ) : null
                            }
                            {
                                inputType === 'class_hash' ? (
                                    <TextInput
                                        size="sm"
                                        radius={radius}
                                        label={makeFirstLetterUpperCase(currentItem.name ?? "unknown")}
                                        description={`${currentItem.type}`}
                                        {...form.getInputProps(`callData.${index}.value`)}
                                        placeholder="starknet::core::ClassHash"
                                    />
                                ) : null
                            }
                        </Grid.Col>
                    </Grid>
                </Grid.Col>
                <Grid.Col span={{ md: 1 }} hidden={hideDeleteBtn}>
                    <Group className="h-100" align="flex-end">
                        <ActionIcon variant="filled" color="red" radius={'md'} size={'lg'} onClick={() => deleteCallDataObj(index)}>
                            <IconTrash />
                        </ActionIcon>
                    </Group>
                </Grid.Col>
            </Grid>
        </Paper>
    )
}