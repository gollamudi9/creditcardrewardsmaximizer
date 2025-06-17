import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TextInput, Alert } from 'react-native';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AdhocExpense } from '@/types/analytics';
import { Plus, Calendar, Repeat, DollarSign, X, CreditCard as Edit, Trash2 } from 'lucide-react-native';

const EXPENSE_CATEGORIES = [
  'Home Improvement',
  'Medical',
  'Travel',
  'Education',
  'Vehicle',
  'Technology',
  'Emergency',
  'Investment',
  'Other',
];

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function AdhocExpensePlanner() {
  const { colors } = useTheme();
  const {
    adhocExpenses,
    addAdhocExpense,
    updateAdhocExpense,
    deleteAdhocExpense,
    loading,
  } = useAnalytics();

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<AdhocExpense | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: '',
    category: EXPENSE_CATEGORIES[0],
    isRecurring: false,
    frequency: 'monthly' as const,
    endDate: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      date: '',
      category: EXPENSE_CATEGORIES[0],
      isRecurring: false,
      frequency: 'monthly',
      endDate: '',
      description: '',
    });
    setEditingExpense(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (expense: AdhocExpense) => {
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      date: expense.date,
      category: expense.category,
      isRecurring: expense.isRecurring,
      frequency: expense.frequency || 'monthly',
      endDate: expense.endDate || '',
      description: expense.description || '',
    });
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !formData.date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const expenseData = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      date: formData.date,
      category: formData.category,
      isRecurring: formData.isRecurring,
      frequency: formData.isRecurring ? formData.frequency : undefined,
      endDate: formData.isRecurring ? formData.endDate : undefined,
      description: formData.description,
    };

    try {
      if (editingExpense) {
        await updateAdhocExpense(editingExpense.id, expenseData);
      } else {
        await addAdhocExpense(expenseData);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense');
    }
  };

  const handleDelete = (expense: AdhocExpense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAdhocExpense(expense.id),
        },
      ]
    );
  };

  const totalPlannedExpenses = adhocExpenses.reduce((sum, expense) => {
    if (expense.isRecurring) {
      // Calculate annual impact for recurring expenses
      const multiplier = {
        weekly: 52,
        monthly: 12,
        quarterly: 4,
        yearly: 1,
      }[expense.frequency || 'monthly'];
      return sum + (expense.amount * multiplier);
    }
    return sum + expense.amount;
  }, 0);

  const upcomingExpenses = adhocExpenses
    .filter(expense => new Date(expense.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="heading2" bold>Expense Planning</Text>
        <Button
          title="Add Expense"
          leftIcon={<Plus size={16} color="#FFFFFF" />}
          onPress={openAddModal}
          size="small"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text variant="subtitle" medium style={styles.summaryTitle}>
            Planning Summary
          </Text>
          
          <View style={styles.summaryMetrics}>
            <View style={styles.summaryMetric}>
              <Text variant="caption" color={colors.subtext}>Total Planned</Text>
              <Text variant="heading3" bold color={colors.primary}>
                ${totalPlannedExpenses.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text variant="caption" color={colors.subtext}>Total Expenses</Text>
              <Text variant="heading3" bold>
                {adhocExpenses.length}
              </Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text variant="caption" color={colors.subtext}>Recurring</Text>
              <Text variant="heading3" bold>
                {adhocExpenses.filter(e => e.isRecurring).length}
              </Text>
            </View>
          </View>
        </Card>

        {/* Upcoming Expenses */}
        <Card style={styles.upcomingCard}>
          <Text variant="subtitle" medium style={styles.upcomingTitle}>
            Upcoming Expenses
          </Text>
          
          {upcomingExpenses.length > 0 ? (
            upcomingExpenses.map((expense) => (
              <View key={expense.id} style={styles.upcomingItem}>
                <View style={styles.upcomingInfo}>
                  <Text variant="body" medium>{expense.title}</Text>
                  <Text variant="caption" color={colors.subtext}>
                    {new Date(expense.date).toLocaleDateString()} • {expense.category}
                  </Text>
                </View>
                <Text variant="body" bold color={colors.primary}>
                  ${expense.amount.toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <Text variant="body" color={colors.subtext} center>
              No upcoming expenses planned
            </Text>
          )}
        </Card>

        {/* All Expenses List */}
        <Card style={styles.expensesCard}>
          <Text variant="subtitle" medium style={styles.expensesTitle}>
            All Planned Expenses
          </Text>
          
          {adhocExpenses.length > 0 ? (
            adhocExpenses.map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <View style={styles.expenseHeader}>
                    <Text variant="body" medium>{expense.title}</Text>
                    {expense.isRecurring && (
                      <View style={styles.recurringBadge}>
                        <Repeat size={12} color={colors.primary} />
                        <Text variant="caption" color={colors.primary}>
                          {expense.frequency}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text variant="caption" color={colors.subtext}>
                    {new Date(expense.date).toLocaleDateString()} • {expense.category}
                  </Text>
                  {expense.description && (
                    <Text variant="caption" color={colors.subtext} style={styles.expenseDescription}>
                      {expense.description}
                    </Text>
                  )}
                </View>
                
                <View style={styles.expenseActions}>
                  <Text variant="body" bold color={colors.primary} style={styles.expenseAmount}>
                    ${expense.amount.toLocaleString()}
                  </Text>
                  <View style={styles.actionButtons}>
                    <Button
                      title=""
                      variant="ghost"
                      size="small"
                      leftIcon={<Edit size={16} color={colors.subtext} />}
                      onPress={() => openEditModal(expense)}
                      style={styles.actionButton}
                    />
                    <Button
                      title=""
                      variant="ghost"
                      size="small"
                      leftIcon={<Trash2 size={16} color={colors.error} />}
                      onPress={() => handleDelete(expense)}
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <DollarSign size={48} color={colors.subtext} />
              <Text variant="body" color={colors.subtext} center style={styles.emptyText}>
                No expenses planned yet. Add your first expense to start planning your budget.
              </Text>
              <Button
                title="Add First Expense"
                onPress={openAddModal}
                style={styles.emptyButton}
              />
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="heading3" bold>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </Text>
            <Button
              title=""
              variant="ghost"
              leftIcon={<X size={24} color={colors.subtext} />}
              onPress={() => setShowModal(false)}
            />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Title */}
            <View style={styles.formGroup}>
              <Text variant="body" medium style={styles.formLabel}>Title *</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="Enter expense title"
                placeholderTextColor={colors.subtext}
              />
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text variant="body" medium style={styles.formLabel}>Amount *</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                value={formData.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
              />
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text variant="body" medium style={styles.formLabel}>Date *</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.subtext}
              />
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text variant="body" medium style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelector}>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <Button
                      key={category}
                      title={category}
                      variant={formData.category === category ? 'primary' : 'outline'}
                      size="small"
                      onPress={() => setFormData(prev => ({ ...prev, category }))}
                      style={styles.categoryButton}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Recurring Toggle */}
            <View style={styles.formGroup}>
              <View style={styles.recurringToggle}>
                <Text variant="body" medium>Recurring Expense</Text>
                <Button
                  title={formData.isRecurring ? 'Yes' : 'No'}
                  variant={formData.isRecurring ? 'primary' : 'outline'}
                  size="small"
                  onPress={() => setFormData(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
                />
              </View>
            </View>

            {/* Frequency (if recurring) */}
            {formData.isRecurring && (
              <View style={styles.formGroup}>
                <Text variant="body" medium style={styles.formLabel}>Frequency</Text>
                <View style={styles.frequencySelector}>
                  {FREQUENCIES.map((freq) => (
                    <Button
                      key={freq.value}
                      title={freq.label}
                      variant={formData.frequency === freq.value ? 'primary' : 'outline'}
                      size="small"
                      onPress={() => setFormData(prev => ({ ...prev, frequency: freq.value as any }))}
                      style={styles.frequencyButton}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* End Date (if recurring) */}
            {formData.isRecurring && (
              <View style={styles.formGroup}>
                <Text variant="body" medium style={styles.formLabel}>End Date (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  value={formData.endDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.subtext}
                />
              </View>
            )}

            {/* Description */}
            <View style={styles.formGroup}>
              <Text variant="body" medium style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.textAreaInput, { color: colors.text, borderColor: colors.border }]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Add notes about this expense..."
                placeholderTextColor={colors.subtext}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowModal(false)}
              style={styles.modalButton}
            />
            <Button
              title={editingExpense ? 'Update' : 'Add Expense'}
              onPress={handleSave}
              loading={loading}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 20,
  },
  summaryTitle: {
    marginBottom: 16,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryMetric: {
    alignItems: 'center',
  },
  upcomingCard: {
    marginBottom: 16,
    padding: 16,
  },
  upcomingTitle: {
    marginBottom: 16,
  },
  upcomingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  upcomingInfo: {
    flex: 1,
  },
  expensesCard: {
    marginBottom: 20,
    padding: 16,
  },
  expensesTitle: {
    marginBottom: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    gap: 2,
  },
  expenseDescription: {
    marginTop: 4,
  },
  expenseActions: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  emptyButton: {
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    marginRight: 8,
  },
  recurringToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frequencySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});