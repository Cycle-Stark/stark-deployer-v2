

import { Radio, Group, Text } from '@mantine/core'
import classes from './customRadio.module.css';

const CustomRadioInput = ({item}: {item: {name: string, value: string, description?: string}}) => {
  return (
    <Radio.Card className={classes.root} radius="md" value={item.value} key={item.name}>
      <Group wrap="nowrap" align="flex-start">
        <Radio.Indicator />
        <div>
          <Text className={classes.label}>{item.name}</Text>
          {item.description && (
            <Text className={classes.description}>{item.description}</Text>
          )}
        </div>
      </Group>
    </Radio.Card>
  )
}

export default CustomRadioInput