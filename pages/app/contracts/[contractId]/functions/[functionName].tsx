import CustomCardWithHeaderAndFooter from '@/components/common/CustomCardWithHeaderAndFooter'
import ContractLayout from '@/layouts/ContractLayout'
import InnerLayout from '@/layouts/InnerLayout'
import TransactionResultsAccordion from '@/components/contracts/TransactionResultsAccordion'
import FunctionInteractionsTable from '@/components/contracts/FunctionInteractionsTable'
import FunctionSourceCode from '@/components/contracts/FunctionSourceCode'
import { Box, Button, Grid, Group, ScrollArea, Stack, Text, useMantineTheme } from '@mantine/core'
import { IconCode, IconFileCode, IconListCheck, IconPhoneCall, IconSend2 } from '@tabler/icons-react'
import React, { useEffect, useRef, useState } from 'react'
import { useMantineColorScheme } from '@mantine/core'
import { useContract } from '@/contexts/ContractProvider'
import { IAbiEntry, ICallDataItem } from '@/types'
import { CallDataItem } from '@/components/contracts/CallDataItem'
import { useForm } from '@mantine/form'
import { logsManager } from '@/storage/logsDatabase'
import { ContractInteractionsManager } from '@/storage/contractInteractionsDatabase'
import { CallData, CallResult, InvokedTransaction, LibraryError, RpcError } from 'starknet'
import { customSerializer, serializeBigInt } from '@/components/utils'
import { useAppContext } from '@/contexts/AppContext'
import { contractInteractionService } from '@/services/contractInteractionService'
import { notifications } from '@mantine/notifications'


const SingleFunction = () => {

  const { connectedAccount, provider } = useAppContext()
  const { contract, actualContract, functionName, getFunction, actualContractAbi, contractId } = useContract();
  const [functionData, setFunctionData] = useState<IAbiEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const isMountedRef = useRef(true)

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  const currentFunction = functionName ? getFunction(functionName) : null
  const functionSignature = currentFunction?.signature || null

  const form = useForm<{
    callData: ICallDataItem[],
    events: any[],
    result: any,
    transactionHash: string,
    receipt: any,
    transactionStatus: string
  }>({
    initialValues: {
      callData: [],
      events: [],
      result: null,
      transactionHash: "",
      receipt: null,
      transactionStatus: ""
    },
    validate: (values) => {
      const errors: Record<string, string> = {}
      for (let i = 0; i < values.callData.length; i++) {
        const item = values.callData[i]
        if (item.value === "") {
          errors[`callData.${i}.value`] = "Value is required"
        }
      }
      return errors
    }
  })

  const handleGetFunction = () => {
    form.reset()
    if (!functionName) return
    const functionData = getFunction(functionName)
    setFunctionData(functionData)
    form.setFieldValue('callData', functionData?.callDataItems || [])
  }

  const handleFormSubmission = async () => {
    const formValidation = form.validate()
    if (!formValidation.hasErrors) {
      logsManager.logInfo(`Function Invoked: ${functionName}`)
      logsManager.logInfo(`${JSON.stringify(form.values, null, 4)}`)
    } else {
      for (const [key, value] of Object.entries(formValidation.errors)) {
        logsManager.logError(`${key}: ${value}`)
      }
    }

    if (!functionName) {
      logsManager.logError(`Function name not found`)
      return
    }

    if (!actualContract) {
      logsManager.logError(`Actual contract not found`)
      return
    }

    if (!contractId) {
      logsManager.logError(`Contract ID not found`)
      return
    }

    const args: Record<string, any> = {}
    for (let i = 0; i < form.values.callData.length; i++) {
      const item = form.values.callData[i]
      args[item.name] = item.value
    }

    const interactionsManager = ContractInteractionsManager.getInstance()
    let interactionId: number | null = null

    try {
      setLoading(true)
      form.setFieldValue('result', null)
      form.setFieldValue('transactionHash', "")
      form.setFieldValue('receipt', null)
      form.setFieldValue('events', [])
      form.setFieldValue('transactionStatus', "")

      const functionCallArgs = actualContract.populate(functionName, args)
      if (!functionCallArgs.calldata) {
        logsManager.logError(`Function call data not found`)
        setLoading(false)
        return
      }

      interactionId = await interactionsManager.create({
        contractId: parseInt(contractId),
        functionName,
        functionType: functionData?.state_mutability === "view" ? 'read' : 'write',
        rawCallData: functionCallArgs.calldata as string[],
        callDataItems: form.values.callData,
        status: 'pending',
        timestamp: new Date()
      })

      let result: InvokedTransaction | CallResult
      if (functionData?.state_mutability === "view") {
        result = await actualContract.call(functionName, functionCallArgs.calldata as [CallData])
        const serializedResult = JSON.stringify(JSON.parse(customSerializer(result)), null, 4)

        form.setFieldValue('result', serializedResult)
        form.setFieldValue('transactionStatus', "Call Successful")

        if (interactionId) {
          await interactionsManager.update(interactionId, {
            response: serializeBigInt(result),
            status: 'success'
          })
        }
      } else {
        if (!connectedAccount) {
          logsManager.logError(`Connected account not found`)
          setLoading(false)
          return
        }

        const transaction = {
          contractAddress: actualContract.address,
          entrypoint: functionName,
          calldata: functionCallArgs.calldata as string[],
        }
        result = await actualContract.invoke(functionName, functionCallArgs.calldata as [CallData]) as InvokedTransaction
        form.setFieldValue('transactionHash', result.transaction_hash)
        form.setFieldValue('transactionStatus', "Transaction Submitted")

        if (interactionId) {
          await interactionsManager.update(interactionId, {
            transactionHash: result.transaction_hash
          })
        }

        logsManager.logInfo(`Function invoke transaction hash: ${result.transaction_hash}`)

        notifications.show({
          title: 'Transaction Submitted',
          message: `${functionName} transaction submitted. Waiting for confirmation...`,
          color: 'blue',
        })

        contractInteractionService.monitorTransaction({
          interactionId: interactionId!,
          transactionHash: result.transaction_hash,
          provider,
          functionName,
          actualContract,
          onSettled: ({ status, receipt, events }) => {
            if (!isMountedRef.current) return
            if (status === 'success') {
              form.setFieldValue('receipt', receipt)
              form.setFieldValue('transactionStatus', 'Transaction Successful')
              if (events) form.setFieldValue('events', events)
            } else if (status === 'reverted') {
              form.setFieldValue('receipt', receipt)
              form.setFieldValue('transactionStatus', 'Transaction Reverted')
            } else {
              form.setFieldValue('transactionStatus', 'Transaction Failed')
            }
          },
        }).catch((error) => {
          console.error('Transaction monitoring error:', error)
        })
      }

      logsManager.logSuccess(`Function call successful:`)
      logsManager.logSuccess(JSON.stringify(serializeBigInt(result), null, 4))
      setLoading(false)
    } catch (error: any) {
      let errorMessage = 'Unknown error occurred'

      if (error instanceof LibraryError) {
        errorMessage = error.message
        logsManager.logError(`Function call failed --> ${error.message}`)
      } else if (error instanceof RpcError) {
        errorMessage = error.message
        logsManager.logError(`Function call failed ---> ${error.message}`)
      } else {
        errorMessage = error?.message ? error.message : error.toString()
        logsManager.logError(`Function call failed > ${errorMessage}`)
      }

      if (interactionId) {
        try {
          await interactionsManager.update(interactionId, {
            status: 'failed',
            errorMessage
          })
        } catch (updateError) {
          logsManager.logError(`Failed to update interaction: ${updateError}`)
        }
      }

      setLoading(false)
    }
  }

  useEffect(() => {
    handleGetFunction()
  }, [functionName, contract])

  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  return (
    <>
      <InnerLayout>
        <ScrollArea h="100%" offsetScrollbars scrollbars="y">
          <Stack p="md">
            <CustomCardWithHeaderAndFooter
              title={`${functionName}`}
              subtitle={`${functionSignature}`}
              Icon={IconFileCode}
              footerContent={
                (
                  <Group justify="flex-end">
                    <Button
                      variant="light"
                      color='violet'
                      radius={"md"}
                      leftSection={functionData?.state_mutability === "view" ? <IconPhoneCall /> : <IconSend2 />}
                      onClick={handleFormSubmission}
                      loading={loading}
                    >
                      {functionData?.state_mutability === "view" ? "Call" : "Invoke"}
                    </Button>
                  </Group>
                )
              }
            >
              {
                functionData?.callDataItems?.length === 0 ? (
                  <Box p={"sm"}>
                    <Text>
                      No Arguments
                    </Text>
                  </Box>
                ) : (
                  <form onSubmit={form.onSubmit(handleFormSubmission)}>
                    <Grid>
                      {
                        functionData?.callDataItems?.map((input, index) => (
                          <Grid.Col span={12} key={index}>
                            <CallDataItem inputType={input.type} form={form} index={index} hideDeleteBtn={true} />
                          </Grid.Col>
                        ))
                      }
                    </Grid>
                  </form>
                )
              }
            </CustomCardWithHeaderAndFooter>

            <CustomCardWithHeaderAndFooter
              title="Source Code"
              subtitle={`How to call ${functionName} programmatically`}
              Icon={IconCode}
              expandable={true}
            >
              {contract && functionName && (
                <FunctionSourceCode
                  contractAddress={contract.address}
                  functionName={functionName}
                  functionData={functionData}
                  callDataItems={form.values.callData}
                />
              )}
            </CustomCardWithHeaderAndFooter>

            <CustomCardWithHeaderAndFooter
              title={`Results`}
              subtitle={`${functionSignature}`}
              Icon={IconFileCode}
            >
              <TransactionResultsAccordion
                data={{
                  result: form.values.result,
                  transactionHash: form.values.transactionHash,
                  receipt: form.values.receipt,
                  events: form.values.events,
                  transactionStatus: form.values.transactionStatus
                }}
              />
            </CustomCardWithHeaderAndFooter>
            <CustomCardWithHeaderAndFooter
              title={`Function Interactions`}
              subtitle={`Previous executions of ${functionName}`}
              Icon={IconListCheck}
            >
              {contractId && functionName && (
                <FunctionInteractionsTable
                  contractId={parseInt(contractId)}
                  functionName={functionName}
                />
              )}
            </CustomCardWithHeaderAndFooter>
          </Stack>
        </ScrollArea>
      </InnerLayout>
    </>
  )
}


SingleFunction.PageLayout = ContractLayout
export default SingleFunction
