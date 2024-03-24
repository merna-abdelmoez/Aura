import { useEffect } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Columns2 } from 'lucide-react';

import Heading from '@renderer/components/Heading';
import Dropzone from '@renderer/components/Dropzone';
import OutputImage from '@renderer/components/OutputImage';
import { Form, FormControl, FormField, FormItem } from '@renderer/components/ui/form';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select';
import { Button } from '@renderer/components/ui/button';

import useGlobalState from '@renderer/hooks/useGlobalState';
import { useToast } from '@renderer/components/ui/use-toast';

import placeholder from '@renderer/assets/placeholder.png';

const thresholdingSchema = z.object({
  type: z.enum(['local', 'global']).nullable(),
  threshold: z.number(),
  thresholdMargin: z.number(),
  blockSize: z.number()
});

const thresholdingOptions = [
  { label: 'Local Thresholding', value: 'local' },
  { label: 'Global Thresholding', value: 'global' }
];

const inputs = [
  {
    value: 'local',
    inputs: [
      { label: 'Thresholding Margin', name: 'thresholdMargin', min: 0, max: 255, step: 1 },
      { label: 'Block Size', name: 'blockSize', min: 1, max: 13, step: 2 }
    ]
  },
  {
    value: 'global',
    inputs: [{ label: 'Threshold', name: 'threshold', min: 0, max: 255, step: 1 }]
  }
];

function Thresholding() {
  const ipcRenderer = (window as any).ipcRenderer;

  const {
    filesIds,
    setFileId,
    setUploadedImageURL,
    setProcessedImageURL,
    isProcessing,
    setIsProcessing
  } = useGlobalState();

  const form = useForm<z.infer<typeof thresholdingSchema>>({
    resolver: zodResolver(thresholdingSchema),
    defaultValues: {
      threshold: 127,
      thresholdMargin: 7,
      blockSize: 11
    }
  });

  const { toast } = useToast();

  useEffect(() => {
    setIsProcessing(false);
    setFileId(0, null);
    setUploadedImageURL(0, null);
    setProcessedImageURL(0, null);
  }, []);

  useEffect(() => {
    const imageReceivedListener = (event: any) => {
      if (event.data.image) {
        setProcessedImageURL(0, event.data.image);
      }
      setIsProcessing(false);
    };
    ipcRenderer.on('image:received', imageReceivedListener);

    return () => {
      ipcRenderer.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    const imageErrorListener = () => {
      toast({
        title: 'Something went wrong',
        description: "Thresholding couldn't be applied on your image, please try again later.",
        variant: 'destructive'
      });
      setIsProcessing(false);
    };
    ipcRenderer.on('image:error', imageErrorListener);

    return () => {
      ipcRenderer.removeAllListeners();
    };
  }, []);

  const onSubmit = (data: z.infer<typeof thresholdingSchema>) => {
    const body = {
      type: data.type,
      threshold: data.threshold,
      thresholdMargin: data.thresholdMargin,
      blockSize: data.blockSize
    };

    setIsProcessing(true);
    ipcRenderer.send('process:image', {
      body,
      url: `/api/thresholding/${filesIds[0]}`
    });
  };

  return (
    <div>
      <Heading
        title="Thresholding"
        description="Apply thresholding to an image to segment it into regions."
        icon={Columns2}
        iconColor="text-green-700"
        bgColor="bg-green-700/10"
      />
      <div className="px-4 lg:px-8">
        <div className="mb-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-wrap gap-4 justify-between items-end"
            >
              <div className="flex flex-wrap gap-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="w-[250px] mr-4">
                      <Label htmlFor="thresholdingType">Thrsholding Type</Label>
                      <Select disabled={isProcessing} onValueChange={field.onChange}>
                        <FormControl id="thresholdingType">
                          <SelectTrigger>
                            <SelectValue placeholder="Select thresholding type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Thresholding</SelectLabel>

                            {thresholdingOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="flex flex-wrap gap-2">
                  {inputs.find((input) => input.value === form.watch('type')) &&
                    inputs
                      .find((input) => input.value === form.watch('type'))
                      ?.inputs.map((input) => {
                        return (
                          <FormField
                            key={input.name}
                            name={input.name}
                            render={({ field }) => (
                              <FormItem className="w-[150px]">
                                <Label htmlFor={input.name}>{input.label}</Label>
                                <FormControl className="p-2">
                                  <Input
                                    type="number"
                                    disabled={isProcessing}
                                    id={input.name}
                                    min={input.min}
                                    max={input.max}
                                    step={input.step}
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        );
                      })}
                </div>
              </div>
              <Button disabled={!filesIds[0] || isProcessing} type="submit">
                Apply Thresholding
              </Button>
            </form>
          </Form>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <Dropzone index={0} />
          <OutputImage index={0} placeholder={placeholder} />
        </div>
      </div>
    </div>
  );
}

export const Route = createLazyFileRoute('/thresholding')({
  component: Thresholding
});
