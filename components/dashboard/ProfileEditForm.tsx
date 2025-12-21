'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  agencyProfileSchema,
  type AgencyProfileFormData,
  DESCRIPTION_MAX_LENGTH,
  EMPLOYEE_COUNT_OPTIONS,
  FOUNDED_YEAR_OPTIONS,
  requiresAdminApproval,
  getPlainTextLength,
} from '@/lib/validations/agency-profile';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileEditFormProps {
  initialData?: Partial<AgencyProfileFormData>;
  onSubmit: (data: AgencyProfileFormData) => Promise<void>;
  onCancel?: () => void;
}

/**
 * Profile edit form for agency owners to update company information
 *
 * Features:
 * - All basic agency fields (name, description, contact info, etc.)
 * - TipTap rich text editor for description
 * - Real-time validation with Zod
 * - Unsaved changes warning
 * - Character counter for description
 * - Admin approval warning for name changes
 */
export function ProfileEditForm({
  initialData,
  onSubmit,
  onCancel,
}: ProfileEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [showNameWarning, setShowNameWarning] = useState(false);

  const form = useForm<AgencyProfileFormData>({
    resolver: zodResolver(agencyProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      website: initialData?.website || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      founded_year: initialData?.founded_year || '',
      employee_count: initialData?.employee_count || '',
      headquarters: initialData?.headquarters || '',
    },
  });

  // TipTap editor for description
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable link from StarterKit as we're using our own Link extension
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Enter your company description...',
      }),
    ],
    content: initialData?.description || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[200px] focus:outline-none p-4 border rounded-md',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      form.setValue('description', html, { shouldDirty: true });
      const length = getPlainTextLength(html);
      setDescriptionLength(length);
    },
  });

  // Update description length on mount
  useEffect(() => {
    if (editor && initialData?.description) {
      const length = getPlainTextLength(initialData.description);
      setDescriptionLength(length);
    }
  }, [editor, initialData?.description]);

  // Check for name changes to show admin approval warning
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === 'name' && value.name && initialData?.name) {
        const needsApproval = requiresAdminApproval(
          initialData.name,
          value.name
        );
        setShowNameWarning(needsApproval);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, initialData?.name]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty]);

  const handleSubmit = async (data: AgencyProfileFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset(data); // Reset with new values to clear dirty state
    } catch (error) {
      console.error('Form submission error:', error);
      throw error; // Re-throw for parent component to handle
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmed) return;
    }

    form.reset();
    if (editor) {
      editor.commands.setContent(initialData?.description || '');
    }
    onCancel?.();
  };

  // TipTap toolbar buttons
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run();
  const setLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Company Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Company Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your Company Name" />
              </FormControl>
              {showNameWarning && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Changing the company name requires admin approval. Your
                    request will be reviewed within 2 business days.
                  </AlertDescription>
                </Alert>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description (Rich Text) */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Company Description
              </label>
              <div className="space-y-2" data-testid="description-editor">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleBold}
                    className={cn(editor?.isActive('bold') && 'bg-accent')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleItalic}
                    className={cn(editor?.isActive('italic') && 'bg-accent')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleBulletList}
                    className={cn(
                      editor?.isActive('bulletList') && 'bg-accent'
                    )}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleOrderedList}
                    className={cn(
                      editor?.isActive('orderedList') && 'bg-accent'
                    )}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={setLink}
                    className={cn(editor?.isActive('link') && 'bg-accent')}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Editor */}
                <EditorContent editor={editor} />

                {/* Character Counter */}
                <div className="flex justify-end">
                  <p
                    className={cn(
                      'text-sm text-muted-foreground',
                      descriptionLength > DESCRIPTION_MAX_LENGTH &&
                        'text-destructive'
                    )}
                  >
                    {descriptionLength} / {DESCRIPTION_MAX_LENGTH} characters
                  </p>
                </div>
              </div>
              <FormDescription>
                Describe your company, services, and what makes you unique.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Website URL */}
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="url"
                  placeholder="https://www.example.com"
                />
              </FormControl>
              <FormDescription>
                Your company website (must include http:// or https://)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} type="tel" placeholder="+12345678900" />
              </FormControl>
              <FormDescription>
                E.164 format (e.g., +1234567890)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="contact@example.com"
                />
              </FormControl>
              <FormDescription>
                Primary contact email for your company
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Founded Year */}
        <FormField
          control={form.control}
          name="founded_year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Founded Year</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[200px]">
                  {FOUNDED_YEAR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The year your company was founded
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Employee Count */}
        <FormField
          control={form.control}
          name="employee_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee Count</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Approximate number of employees in your company
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Headquarters */}
        <FormField
          control={form.control}
          name="headquarters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headquarters Location</FormLabel>
              <FormControl>
                <Input {...field} placeholder="City, State" />
              </FormControl>
              <FormDescription>
                Primary office location (e.g., Houston, TX)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={!form.formState.isDirty || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
