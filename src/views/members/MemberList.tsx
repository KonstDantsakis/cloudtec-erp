// src/pages/members/MemberList.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type RegistrationStatus = 'pending' | 'approved' | 'rejected' | null;

export type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null; // αν δεν το έχεις, μπορείς να το αφαιρέσεις
  auth_user_id: string | null;
  registration_status: RegistrationStatus;
  created_at: string;
};

const MemberListPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editSaving, setEditSaving] = useState<boolean>(false);

  // -------- Fetch members --------
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('customers')
      .select(
        'id, full_name, email, phone, status, auth_user_id, registration_status, created_at',
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setError('Αποτυχία φόρτωσης μελών.');
      setLoading(false);
      return;
    }

    setCustomers((data ?? []) as Customer[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchCustomers();
  }, []);

  // -------- Approve member --------
  const handleApprove = async (customerId: string) => {
    try {
      setApproveLoadingId(customerId);

      const { error } = await supabase
        .from('customers')
        .update({ registration_status: 'approved' })
        .eq('id', customerId);

      if (error) {
        console.error(error);
        alert('Κάτι πήγε στραβά στην έγκριση.');
        return;
      }

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, registration_status: 'approved' } : c,
        ),
      );
    } finally {
      setApproveLoadingId(null);
    }
  };

  // -------- Delete member --------
  const handleDelete = async (customerId: string) => {
    const confirmed = window.confirm(
      'Σίγουρα θέλετε να διαγράψετε αυτό το μέλος;',
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      console.error(error);
      alert('Αποτυχία διαγραφής μέλους.');
      return;
    }

    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  // -------- Edit modal open/close --------
  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingCustomer(null);
  };

  // -------- Save edits --------
  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setEditSaving(true);

    const { id, full_name, email, phone } = editingCustomer;

    const { error } = await supabase
      .from('customers')
      .update({ full_name, email, phone })
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Αποτυχία αποθήκευσης αλλαγών.');
      setEditSaving(false);
      return;
    }

    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, full_name, email, phone } : c)),
    );

    setEditSaving(false);
    closeEditModal();
  };

  // -------- Render --------
  return (
    <div className="container py-4">
      <h1 className="mb-4">Μέλη</h1>

      {loading && <div>Φόρτωση...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Ονοματεπώνυμο</th>
                <th>Email</th>
                <th>Τηλέφωνο</th>
                <th>Κατάσταση εγγραφής</th>
                <th>Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.full_name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>
                    {customer.registration_status === 'pending' && (
                      <span className="badge bg-warning text-dark">
                        Σε αναμονή
                      </span>
                    )}
                    {customer.registration_status === 'approved' && (
                      <span className="badge bg-success">Εγκεκριμένο</span>
                    )}
                    {customer.registration_status === 'rejected' && (
                      <span className="badge bg-danger">Απορριφθέν</span>
                    )}
                    {customer.registration_status === null && (
                      <span className="badge bg-secondary">Άγνωστο</span>
                    )}
                  </td>
                  <td className="d-flex gap-2">
                    {customer.registration_status === 'pending' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => handleApprove(customer.id)}
                        disabled={approveLoadingId === customer.id}
                      >
                        {approveLoadingId === customer.id
                          ? 'Εγκρίνεται...'
                          : 'Έγκριση'}
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openEditModal(customer)}
                    >
                      Επεξεργασία
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(customer.id)}
                    >
                      Διαγραφή
                    </button>
                  </td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    Δεν υπάρχουν μέλη.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal (πολύ basic bootstrap-style) */}
      {editModalOpen && editingCustomer && (
        <div
          className="modal show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSaveEdit}>
                <div className="modal-header">
                  <h5 className="modal-title">Επεξεργασία μέλους</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeEditModal}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Ονοματεπώνυμο</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingCustomer.full_name ?? ''}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          full_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editingCustomer.email ?? ''}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Τηλέφωνο</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={editingCustomer.phone ?? ''}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeEditModal}
                    disabled={editSaving}
                  >
                    Άκυρο
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editSaving}
                  >
                    {editSaving ? 'Αποθήκευση…' : 'Αποθήκευση'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberListPage;
